import { request, QUERY_API_VERSION, VK_APP_ID, VKApiError } from './vk-api-client'
import { type JSONObject, type JSONValue, type Playlist, type SessionIdentity, type TrackItem } from './types'
import { toTrackItemFromAPIResponse } from './converter'
import { playlistCovers } from './catalog-images'
import { getSessionToken } from './session-client'
import { getCredits } from './playlist-credits'
import { withTimeout } from './with-timeout'

export interface MusicPlaylist {
  id: string
  ownerId: string
  title: string
  description: string
  count: number
  plays?: number
  accessKey: string
  covers?: string[]
  authorName?: string
  authorAvatarUrl?: string
  editable?: boolean
  isAlbum?: boolean
  noDiscover?: boolean
  original?: { ownerId: string, id: string }
}

const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value != null && !Array.isArray(value)
const positive = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value > 0
const count = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
const invalid = (): never => { throw new VKApiError('format') }
const owner = (value: string): void => { if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) invalid() }
const endpoint = (method: string) => `https://api.vk.ru/method/audio.${method}?v=${QUERY_API_VERSION}&client_id=${VK_APP_ID}`

const parsePlaylist = (value: unknown): MusicPlaylist => {
  if (!object(value) || !positive(value.id) || typeof value.owner_id !== 'number' || !Number.isSafeInteger(value.owner_id) || value.owner_id === 0 || typeof value.title !== 'string' || !count(value.count)) return invalid()
  if (value.access_key != null && typeof value.access_key !== 'string') return invalid()
  if (value.description != null && typeof value.description !== 'string') return invalid()
  return {
    id: String(value.id),
    ownerId: String(value.owner_id),
    title: value.title,
    description: value.description ?? '',
    count: value.count,
    plays: count(value.plays) ? value.plays : undefined,
    accessKey: value.access_key ?? '',
    covers: playlistCovers(value),
    editable: value.original == null && value.type !== 1 && value.type !== 'album' && (!object(value.permissions) || value.permissions.edit !== false),
    isAlbum: value.type === 1 || value.type === 'album',
    noDiscover: value.no_discover === true || value.no_discover === 1,
    ...(object(value.original) && typeof value.original.owner_id === 'number' && typeof value.original.playlist_id === 'number' ? { original: { ownerId: String(value.original.owner_id), id: String(value.original.playlist_id) } } : {})
  }
}

export const getPlaylists = async (userId: string, offset = 0, signal?: AbortSignal, scope: 'owned' | 'library' = 'owned', identity?: SessionIdentity): Promise<{ items: MusicPlaylist[], nextOffset: number | null }> => {
  owner(userId)
  if (!count(offset)) return invalid()
  const { response } = await request(endpoint('getPlaylists'), 'POST', { owner_id: userId, offset: String(offset), count: '100', extended: '1', fields: 'photo_50,photo_100' }, signal, userId, identity)
  if (!object(response) || !count(response.count) || !Array.isArray(response.items)) return invalid()
  const items = response.items.map(value => {
    const playlist = parsePlaylist(value)
    const credits = getCredits(value as Record<string, unknown>, Array.isArray(response.profiles) ? response.profiles : [], Array.isArray(response.groups) ? response.groups : [])
    return { ...playlist, authorName: credits.name, authorAvatarUrl: credits.avatarUrl }
  })
  const next = offset + items.length
  if (next < response.count && items.length === 0) return invalid()
  return {
    items: items.filter(playlist => scope === 'library' || (playlist.ownerId === userId && playlist.editable)),
    nextOffset: next < response.count ? next : null
  }
}

export const createPlaylist = async (userId: string, title: string, description: string, audioIds: readonly string[] = [], noDiscover = false): Promise<MusicPlaylist> => {
  owner(userId)
  if (title.trim().length === 0) return invalid()
  const ids = [...new Set(audioIds)]
  for (const id of ids) if (!/^-?[1-9]\d*_[1-9]\d*(?:_[\w-]+)?$/.test(id)) return invalid()
  // VK prepends initial tracks, so creation receives the visible order reversed.
  const { response } = await request(endpoint('createPlaylist'), 'POST', { owner_id: userId, title: title.trim(), description, no_discover: noDiscover ? '1' : '0', ...(ids.length > 0 ? { audio_ids: [...ids].reverse().join(',') } : {}) }, undefined, userId)
  const playlist = parsePlaylist(response)
  if (playlist.ownerId !== userId || playlist.count !== ids.length) return invalid()
  return playlist
}

export const addTrackToPlaylist = async (userId: string, playlistId: string, audioId: string, accessKey = ''): Promise<void> => {
  owner(userId)
  if (!/^[1-9]\d*$/.test(playlistId) || !/^-?[1-9]\d*_[1-9]\d*$/.test(audioId) || (accessKey.length > 0 && !/^[\w-]+$/.test(accessKey))) return invalid()
  const { response } = await request(endpoint('addToPlaylist'), 'POST', { owner_id: userId, playlist_id: playlistId, audio_ids: accessKey.length > 0 ? `${audioId}_${accessKey}` : audioId }, undefined, userId)
  if (!Array.isArray(response) || response.length !== 1 || !object(response[0]) || !positive(response[0].audio_id)) return invalid()
}

export interface PlaylistFollowResult {
  followed: boolean
  followedPlaylist?: { ownerId: string, id: string }
}

export const setFollowed = async (userId: string, playlist: Playlist, followed: boolean): Promise<PlaylistFollowResult> => {
  owner(userId)
  if (!/^-?[1-9]\d*$/.test(playlist.ownerId) || !/^[1-9]\d*$/.test(playlist.id)) return invalid()
  return await withTimeout(async signal => {
    const { identity } = await getSessionToken(signal)
    if (identity.userId !== userId) throw new VKApiError('session-changed')
    if (followed) {
      const { response } = await request(endpoint('followPlaylist'), 'POST', { owner_id: playlist.ownerId, playlist_id: playlist.id, ...(playlist.accessHash.length > 0 ? { access_key: playlist.accessHash } : {}) }, signal, userId, identity)
      if (!object(response) || !positive(response.playlist_id) || response.owner_id !== Number(userId)) return invalid()
      return { followed: true, followedPlaylist: { ownerId: userId, id: String(response.playlist_id) } }
    }
    let copy = playlist.followedPlaylist ?? (playlist.ownerId === userId ? { ownerId: userId, id: playlist.id } : undefined)
    let offset: number | null = 0
    while (copy == null && offset != null) {
      const page = await getPlaylists(userId, offset, signal, 'library', identity)
      const item = page.items.find(item => item.ownerId === userId && item.original?.ownerId === playlist.ownerId && item.original.id === playlist.id)
      if (item != null) copy = { ownerId: item.ownerId, id: item.id }
      offset = page.nextOffset
    }
    if (copy == null) return { followed: false }
    if (copy.ownerId !== userId) return invalid()
    owner(copy.id)
    const { response } = await request(endpoint('deletePlaylist'), 'POST', { owner_id: userId, playlist_id: copy.id }, signal, userId, identity)
    if (response !== 1) return invalid()
    return { followed: false }
  }, 15_000)
}

export const getPlaylist = async (userId: string, playlistId: string, signal?: AbortSignal): Promise<MusicPlaylist> => {
  owner(userId)
  owner(playlistId)
  const { response } = await request(endpoint('getPlaylistById'), 'POST', { owner_id: userId, playlist_id: playlistId }, signal, userId)
  const playlist = parsePlaylist(response)
  if (playlist.ownerId !== userId || playlist.id !== playlistId || !playlist.editable) return invalid()
  return playlist
}

const parseTrack = (value: JSONValue): TrackItem => {
  if (!object(value) || !positive(value.id) || typeof value.owner_id !== 'number' || !Number.isSafeInteger(value.owner_id) || value.owner_id === 0 || typeof value.title !== 'string' || typeof value.artist !== 'string' || !count(value.duration)) return invalid()
  return toTrackItemFromAPIResponse({ response: [{ ...value, access_key: value.access_key ?? '', url: value.url ?? '', track_code: value.track_code ?? '', thumb: value.thumb ?? { photo_68: '' }, main_artists: value.main_artists ?? [] } as JSONObject] })
}

export const getTracks = async (userId: string, playlistId?: string, offset = 0, signal?: AbortSignal): Promise<{ items: TrackItem[], nextOffset: number | null }> => {
  owner(userId)
  if (playlistId != null) owner(playlistId)
  if (!count(offset)) return invalid()
  const { response } = await request(endpoint('get'), 'POST', { owner_id: userId, offset: String(offset), count: '100', ...(playlistId == null ? {} : { album_id: playlistId }) }, signal, userId)
  if (!object(response) || !count(response.count) || !Array.isArray(response.items)) return invalid()
  const items = response.items.map(parseTrack)
  const next = offset + items.length
  if (next < response.count && items.length === 0) return invalid()
  return { items, nextOffset: next < response.count ? next : null }
}

export const deletePlaylist = async (userId: string, playlistId: string): Promise<void> => {
  owner(userId)
  owner(playlistId)
  const { response } = await request(endpoint('deletePlaylist'), 'POST', { owner_id: userId, playlist_id: playlistId }, undefined, userId)
  if (response !== 1) return invalid()
}

export const editPlaylist = async (userId: string, playlistId: string, title: string, description: string, audioIds: readonly string[], noDiscover = false): Promise<void> => {
  owner(userId)
  owner(playlistId)
  if (title.trim().length === 0) return invalid()
  const ids = [...new Set(audioIds)]
  for (const id of ids) if (!/^-?[1-9]\d*_[1-9]\d*(?:_[\w-]+)?$/.test(id)) return invalid()
  const { response } = await request(endpoint('editPlaylist'), 'POST', { owner_id: userId, playlist_id: playlistId, title: title.trim(), description, audio_ids: ids.join(','), no_discover: noDiscover ? '1' : '0' }, undefined, userId)
  if (response !== 1) return invalid()
}

export const toPlaybackPlaylist = (value: MusicPlaylist): Playlist => ({
  id: value.id,
  ownerId: value.ownerId,
  title: value.title,
  accessHash: value.accessKey,
  blockId: '',
  tracks: [],
  isRadio: false,
  isVkMix: false,
  nextOffset: '',
  hasMore: false,
  followHash: '',
  isFollowed: value.original != null || value.isAlbum === true
})

export const getTracksByIds = async (userId: string, audioIds: readonly string[], signal?: AbortSignal): Promise<TrackItem[]> => {
  owner(userId)
  for (const id of audioIds) if (!/^-?[1-9]\d*_[1-9]\d*(?:_[\w-]+)?$/.test(id)) return invalid()
  const tracks: TrackItem[] = []
  for (let offset = 0; offset < audioIds.length; offset += 100) {
    const { response } = await request(endpoint('getById'), 'POST', { audios: audioIds.slice(offset, offset + 100).join(',') }, signal, userId)
    if (!Array.isArray(response)) return invalid()
    tracks.push(...response.map(parseTrack))
  }
  return tracks
}

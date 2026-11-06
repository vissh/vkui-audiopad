import { request, QUERY_API_VERSION, VK_APP_ID, VKApiError } from './vk-api-client'
import { type Playlist } from './types'
import { playlistCovers } from './catalog-images'

export interface MusicPlaylist {
  id: string
  ownerId: string
  title: string
  description: string
  count: number
  accessKey: string
  covers?: string[]
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
  return { id: String(value.id), ownerId: String(value.owner_id), title: value.title, description: value.description ?? '', count: value.count, accessKey: value.access_key ?? '', covers: playlistCovers(value) }
}

export const getPlaylists = async (userId: string, offset = 0, signal?: AbortSignal): Promise<{ items: MusicPlaylist[], nextOffset: number | null }> => {
  owner(userId)
  if (!count(offset)) return invalid()
  const { response } = await request(endpoint('getPlaylists'), 'POST', { owner_id: userId, offset: String(offset), count: '100' }, signal, userId)
  if (!object(response) || !count(response.count) || !Array.isArray(response.items)) return invalid()
  const items = response.items.map(value => ({ playlist: parsePlaylist(value), raw: value }))
  const next = offset + items.length
  if (next < response.count && items.length === 0) return invalid()
  return {
    items: items.filter(({ playlist, raw }) => playlist.ownerId === userId && object(raw) && raw.original == null && raw.type !== 1).map(({ playlist }) => playlist),
    nextOffset: next < response.count ? next : null
  }
}

export const createPlaylist = async (userId: string, title: string, description: string, audioIds: readonly string[] = []): Promise<MusicPlaylist> => {
  owner(userId)
  if (title.trim().length === 0) return invalid()
  const ids = [...new Set(audioIds)]
  for (const id of ids) if (!/^-?[1-9]\d*_[1-9]\d*(?:_[\w-]+)?$/.test(id)) return invalid()
  const { response } = await request(endpoint('createPlaylist'), 'POST', { owner_id: userId, title: title.trim(), description, ...(ids.length > 0 ? { audio_ids: ids.join(',') } : {}) }, undefined, userId)
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
  isFollowed: false
})

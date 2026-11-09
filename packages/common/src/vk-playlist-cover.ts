import { request, VK_APP_ID, VKApiError } from './vk-api-client'
import { getSessionToken, requestSession } from './session-client'
import { type JSONObject, type SessionIdentity } from './types'
import { withTimeout } from './with-timeout'

export interface PlaylistCoverUpload {
  identity: SessionIdentity
  payload: JSONObject
  savedPhoto?: { hash: string, photo: JSONObject }
}

// The current website uses 5.255 for its playlist-cover protocol.
const endpoint = (method: string) => `https://api.vk.ru/method/${method}?v=5.255&client_id=${VK_APP_ID}`
const object = (value: unknown): value is JSONObject => typeof value === 'object' && value != null && !Array.isArray(value)

export const upload = async (userId: string, file: Blob, signal?: AbortSignal): Promise<PlaylistCoverUpload> => {
  if (!/^[1-9]\d*$/.test(userId) || !['image/jpeg', 'image/png'].includes(file.type) || file.size === 0 || file.size > 5 * 1024 * 1024) throw new VKApiError('format')
  return await withTimeout(async requestSignal => {
    const { identity } = await getSessionToken(requestSignal)
    if (identity.userId !== userId) throw new VKApiError('session-changed')
    const { response } = await request(endpoint('photos.getAudioPlaylistCoverUploadServer'), 'POST', { owner_id: userId }, requestSignal, userId, identity)
    if (!object(response)) throw new VKApiError('format')
    const uploadUrl = response.upload_url ?? response.fallback_upload_url
    if (typeof uploadUrl !== 'string') throw new VKApiError('format')
    let url: URL
    try { url = new URL(uploadUrl) } catch { throw new VKApiError('format') }
    if (url.protocol !== 'https:' || url.hostname !== 'pu.vk.ru') throw new VKApiError('format')
    await requestSession({ kind: 'assert', identity }, requestSignal)
    const body = new FormData()
    body.append('file', file, file.type === 'image/png' ? 'cover.png' : 'cover.jpg')
    let result: Response
    try { result = await fetch(url.href, { method: 'POST', body, signal: requestSignal }) } catch {
      requestSignal.throwIfAborted()
      throw new VKApiError('network')
    }
    if (!result.ok) throw new VKApiError('http')
    let payload: unknown
    try { payload = await result.json() } catch { throw new VKApiError('format') }
    await requestSession({ kind: 'assert', identity }, requestSignal)
    if (!object(payload) || typeof payload.hash !== 'string' || typeof payload.secret !== 'string' || typeof payload.sha !== 'string' || !object(payload.meta) || payload.error_code != null) throw new VKApiError('format')
    return { identity, payload }
  }, 15_000, signal)
}

export const save = async (userId: string, playlistId: string, cover: PlaylistCoverUpload): Promise<void> => {
  if (cover.identity.userId !== userId || !/^[1-9]\d*$/.test(playlistId)) throw new VKApiError('format')
  if (cover.savedPhoto == null) {
    const { response } = await request(endpoint('photos.saveAudioPlaylistCover'), 'POST', { owner_id: userId, response_json: JSON.stringify(cover.payload) }, undefined, userId, cover.identity)
    if (!object(response) || typeof response.hash !== 'string' || !object(response.photo)) throw new VKApiError('format')
    cover.savedPhoto = { hash: response.hash, photo: response.photo }
  }
  const response = cover.savedPhoto
  const attached = await request(endpoint('audio.setPlaylistCoverPhoto'), 'POST', { playlist_owner_id: userId, playlist_id: playlistId, hash: response.hash, photo: JSON.stringify(response.photo) }, undefined, userId, cover.identity)
  if (!object(attached.response) || !Object.keys(attached.response).some(key => /^photo_\d+$/.test(key))) throw new VKApiError('format')
}

export const remove = async (userId: string, playlistId: string): Promise<void> => {
  if (!/^[1-9]\d*$/.test(userId) || !/^[1-9]\d*$/.test(playlistId)) throw new VKApiError('format')
  const { response } = await request(endpoint('audio.deletePlaylistCoverPhoto'), 'POST', { owner_id: userId, playlist_id: playlistId }, undefined, userId)
  if (response !== 1) throw new VKApiError('format')
}

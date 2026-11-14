export type VKApiFailureKind = 'unauthorized' | 'rate-limit' | 'http' | 'network' | 'format' | 'timeout' | 'unavailable' | 'vk' | 'session-changed'

const operations = new Set([
  'web_token', 'session', 'unknown',
  'section', 'load_catalog_section', 'load_block_playlist', 'load_section', 'get_audio_ids_by_source', 'reload_audios', 'queue_params', 'start_playback', 'listened_data', 'add', 'delete_audio', 'restore_audio', 'follow_playlist',
  'account.getProfileNavigationInfo',
  'audio.getLyrics', 'audio.getStreamMixAudios', 'audio.getStreamMixSettings', 'audio.setBroadcast', 'audio.followRadioStation', 'audio.unfollowRadioStation',
  'audio.add', 'audio.delete', 'audio.restore', 'audio.get', 'audio.getById', 'audio.getPlaylists', 'audio.getPlaylistById', 'audio.createPlaylist', 'audio.editPlaylist', 'audio.deletePlaylist', 'audio.followPlaylist', 'audio.addToPlaylist', 'audio.setPlaylistCoverPhoto', 'audio.deletePlaylistCoverPhoto',
  'photos.getAudioPlaylistCoverUploadServer', 'photos.saveAudioPlaylistCover',
  'catalog.getAudio', 'catalog.getAudioArtist', 'catalog.getAudioCurator', 'catalog.getSection'
])
const kinds = new Set<VKApiFailureKind>(['unauthorized', 'rate-limit', 'http', 'network', 'format', 'timeout', 'unavailable', 'vk', 'session-changed'])
const stages = new Set(['request', 'reconnect', 'retry', 'token', 'refresh', 'profile', 'storage', 'transport'])
const contentTypes = new Set(['json', 'html', 'text', 'other', 'missing'])

export interface VKApiErrorDetails {
  status?: number
  code?: number
  operation?: string
  stage?: string
  attempt?: number
  contentType?: string
  redirected?: boolean
}

// This allowlist is also used when receiving errors from another context.
const safeDetails = (details: VKApiErrorDetails): VKApiErrorDetails => ({
  ...(typeof details.status === 'number' && Number.isInteger(details.status) && details.status >= 100 && details.status <= 599 ? { status: details.status } : {}),
  ...(typeof details.code === 'number' && Number.isSafeInteger(details.code) && details.code >= 0 ? { code: details.code } : {}),
  ...(typeof details.operation === 'string' && operations.has(details.operation) ? { operation: details.operation } : {}),
  ...(typeof details.stage === 'string' && stages.has(details.stage) ? { stage: details.stage } : {}),
  ...(details.attempt === 1 || details.attempt === 2 ? { attempt: details.attempt } : {}),
  ...(typeof details.contentType === 'string' && contentTypes.has(details.contentType) ? { contentType: details.contentType } : {}),
  ...(typeof details.redirected === 'boolean' ? { redirected: details.redirected } : {})
})

export class VKApiError extends Error {
  readonly kind: VKApiFailureKind
  readonly status?: number
  readonly code?: number
  readonly operation?: string
  readonly stage?: string
  readonly attempt?: number
  readonly contentType?: string
  readonly redirected?: boolean

  constructor (kind: VKApiFailureKind, details: VKApiErrorDetails = {}) {
    super(`VK request failed (${kind})`)
    this.name = 'VKApiError'
    this.kind = kind
    Object.assign(this, safeDetails(details))
  }
}

export const readVKApiError = (value: unknown): VKApiError | undefined => {
  if (typeof value !== 'object' || value == null || !('kind' in value) || !kinds.has(value.kind as VKApiFailureKind)) return undefined
  return new VKApiError(value.kind as VKApiFailureKind, safeDetails(value as VKApiErrorDetails))
}

export const withVKApiErrorDetails = (error: VKApiError, details: VKApiErrorDetails): VKApiError => {
  const result = new VKApiError(error.kind, { ...details, ...safeDetails(error) })
  result.stack = error.stack
  return result
}

export const requestOperation = (url: string): string => {
  try {
    const target = new URL(url)
    if (target.protocol !== 'https:' || !['vk.ru', 'login.vk.ru', 'api.vk.ru', 'web.api.vk.ru'].includes(target.hostname)) return 'unknown'
    const candidate = target.hostname === 'login.vk.ru' && target.pathname === '/'
      ? target.searchParams.get('act')
      : target.hostname === 'vk.ru' && target.pathname === '/al_audio.php'
        ? target.searchParams.get('act')
        : target.pathname.startsWith('/method/') ? target.pathname.slice('/method/'.length) : null
    return candidate != null && operations.has(candidate) ? candidate : 'unknown'
  } catch { return 'unknown' }
}

export const responseDetails = (response: Response): VKApiErrorDetails => {
  const type = response.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase()
  return {
    status: response.status,
    contentType: type == null ? 'missing' : type === 'application/json' || type.endsWith('+json') ? 'json' : type === 'text/html' ? 'html' : type === 'text/plain' ? 'text' : 'other',
    redirected: response.redirected
  }
}

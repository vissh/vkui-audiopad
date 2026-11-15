import { MessageTarget, MessageType, type Message, type TrackItem, type Playlist, type PlayerCommand, type CommandReply } from './types'
import { isObject } from './session-client'

const text = (value: unknown): value is string => typeof value === 'string' && value.length <= 65_536
const number = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0
const integer = (value: unknown): value is number => number(value) && Number.isSafeInteger(value)
const strings = (value: Record<string, unknown>, keys: string[]): boolean => keys.every(key => text(value[key]))
const optionalStrings = (value: Record<string, unknown>, keys: string[]): boolean => keys.every(key => value[key] === undefined || text(value[key]))
const artists = (value: unknown): boolean => Array.isArray(value) && value.length <= 1000 && value.every(item => isObject(item) && strings(item, ['id', 'name']))

export const isTrack = (value: unknown): value is TrackItem => isObject(value) &&
  strings(value, ['id', 'accessKey', 'url', 'image', 'artist', 'title', 'context', 'trackCode', 'addHash', 'editHash', 'actionHash', 'deleteHash', 'replaceHash', 'urlHash', 'restoreHash']) &&
  typeof value.id === 'string' && value.id.length > 0 && typeof value.fromAct === 'boolean' &&
  artists(value.mainArtists) && artists(value.featArtists) && number(value.duration) && integer(value.flags) &&
  optionalStrings(value, ['radioBackground']) && (value.radioFollowed === undefined || typeof value.radioFollowed === 'boolean')

export const isPlaylist = (value: unknown): value is Playlist => isObject(value) &&
  strings(value, ['id', 'ownerId', 'blockId', 'title', 'accessHash', 'nextOffset', 'followHash']) &&
  Array.isArray(value.tracks) && value.tracks.length <= 50_000 && value.tracks.every(isTrack) &&
  ['isRadio', 'isVkMix', 'hasMore', 'isFollowed'].every(key => typeof value[key] === 'boolean') &&
  optionalStrings(value, ['mixId', 'mixOptions', 'mixEntityId', 'catalogLink', 'catalogLayout']) &&
  (value.canFollow === undefined || typeof value.canFollow === 'boolean') &&
  (value.followedPlaylist === undefined || (isObject(value.followedPlaylist) && strings(value.followedPlaylist, ['id', 'ownerId'])))

const equalizer = (value: unknown): boolean => isObject(value) && typeof value.enabled === 'boolean' &&
  Array.isArray(value.gains) && [5, 10].includes(value.gains.length) &&
  value.gains.every(gain => typeof gain === 'number' && Number.isFinite(gain) && Math.abs(gain) <= 12) &&
  (value.preamp === undefined || (typeof value.preamp === 'number' && Number.isFinite(value.preamp) && Math.abs(value.preamp) <= 12))
const volume = (value: unknown): boolean => number(value) && value <= 1

export const isPlayerCommand = (value: unknown): value is PlayerCommand => {
  if (!isObject(value)) return false
  if (('requestId' in value || 'expiresAt' in value) && (
    typeof value.requestId !== 'string' || value.requestId.length === 0 || value.requestId.length > 100 ||
    typeof value.expiresAt !== 'number' || !Number.isFinite(value.expiresAt)
  )) return false
  if (value.target === MessageTarget.SERVICE_WORKER) {
    switch (value.type) {
      case MessageType.REPEAT:
      case MessageType.NEXT_TRACK:
      case MessageType.PREVIOUS_TRACK:
      case MessageType.RELOAD_TRACK:
      case MessageType.TOGGLE_PLAYBACK:
      case MessageType.TOGGLE_SHUFFLE:
      case MessageType.RETRY_EQUALIZER: return true
      case MessageType.PLAY_OR_PAUSE: return typeof value.played === 'boolean'
      case MessageType.CURRENT_TIME: return number(value.value)
      case MessageType.ACTIVE_TRACK: return (value.trackId === null || text(value.trackId)) && isPlaylist(value.playlist)
      case MessageType.ADD_TO_QUEUE:
      case MessageType.DELETE_TRACK: return isTrack(value.track)
      case MessageType.APPEND_CURRENT_PLAYLIST: return isPlaylist(value.basePlaylist) && isPlaylist(value.playlist)
      case MessageType.EDIT_CURRENT_PLAYLIST: return isPlaylist(value.oldPlaylist) && isPlaylist(value.playlist) && Array.isArray(value.actions) && value.actions.length <= 50_000 && value.actions.every(action => Array.isArray(action) && ((action[0] === 'remove' && action.length === 2 && integer(action[1])) || (action[0] === 'move' && action.length === 3 && integer(action[1]) && integer(action[2]))))
      default: return false
    }
  }
  if (value.target === MessageTarget.OFFSCREEN) {
    switch (value.type) {
      case MessageType.PLAY_TRACK: return text(value.playbackId) && value.playbackId.length > 0 && text(value.url) && /^(?:https?:\/\/|data:audio\/[\w.+-]+;base64,)/.test(value.url) && volume(value.volume) && (value.equalizer === undefined || equalizer(value.equalizer))
      case MessageType.PLAY_OR_PAUSE: return typeof value.played === 'boolean'
      case MessageType.CHANGE_VOLUME: return volume(value.value)
      case MessageType.CHANGE_CURRENT_TIME: return number(value.value)
      case MessageType.CHANGE_EQUALIZER: return equalizer(value.value)
      default: return false
    }
  }
  return false
}

export const isRuntimeMessage = (value: unknown): value is Message => {
  if (isPlayerCommand(value)) return true
  if (!isObject(value)) return false
  if (value.target === MessageTarget.OFFSCREEN) return value.type === MessageType.GET_PLAYER_SNAPSHOT && text(value.requestId) && value.requestId.length > 0 && value.requestId.length <= 100
  if (value.target !== MessageTarget.SERVICE_WORKER) return false
  switch (value.type) {
    case MessageType.AUDIO_PLAYER_PLAYING: return text(value.playbackId) && number(value.currentTime) && number(value.duration) && volume(value.volume)
    case MessageType.AUDIO_PLAYER_TIMEUPDATED: return text(value.playbackId) && number(value.currentTime) && number(value.duration) && typeof value.paused === 'boolean'
    case MessageType.AUDIO_PLAYER_PAUSE:
    case MessageType.AUDIO_PLAYER_ENDED:
    case MessageType.AUDIO_PLAYER_ERROR: return text(value.playbackId)
    case MessageType.CLOSE_OFFSCREEN_DOCUMENT: return text(value.documentId) && (value.playbackId === null || text(value.playbackId)) && integer(value.activityRevision)
    case MessageType.EQUALIZER_STATUS: return (value.playbackId === null || text(value.playbackId)) && typeof value.status === 'string' && ['off', 'waiting', 'loading', 'active', 'unavailable'].includes(value.status)
    default: return false
  }
}

export const isCommandReply = (value: unknown): value is CommandReply => isObject(value) && text(value.requestId) && (
  (value.ok === true && typeof value.outcome === 'string' && ['handled', 'applied', 'ignored'].includes(value.outcome)) ||
  (value.ok === false && isObject(value.error) && typeof value.error.message === 'string')
)

export const isTrustedSender = (sender: chrome.runtime.MessageSender): boolean => {
  if (sender.id !== chrome.runtime.id || typeof sender.url !== 'string') return false
  try {
    const candidate = new URL(sender.url)
    const own = new URL(chrome.runtime.getURL(''))
    return candidate.protocol === own.protocol && candidate.host === own.host && candidate.username === '' && candidate.password === ''
  } catch { return false }
}

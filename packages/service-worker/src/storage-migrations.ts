import { initialState, messageValidation, type commonTypes } from '@vk-audiopad/common'
import { serializeStateWrite } from './state-writer'

export const SCHEMA_VERSION = 1

const tuples = (value: unknown): value is commonTypes.AudioTuple[] => Array.isArray(value) && value.length <= 100_000 && value.every(item => Array.isArray(item) && item.length === 2 && item.every(part => typeof part === 'string') && item[0].length > 0)

export const migrationChanges = (stored: Record<string, unknown>): Partial<commonTypes.ApplicationState> => {
  const version = stored.schemaVersion ?? 0
  if (!Number.isInteger(version) || typeof version !== 'number' || version < 0 || version > SCHEMA_VERSION) throw new Error('Unsupported stored state version')
  const changes: Partial<commonTypes.ApplicationState> = {}
  if (version === SCHEMA_VERSION) return changes
  changes.schemaVersion = SCHEMA_VERSION
  for (const key of ['volume', 'volumeBeforeMute']) {
    const value = stored[key]
    if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1)) changes[key] = initialState.Application[key]
  }
  for (const key of ['shuffle', 'castToStatus', 'hlsDebug']) {
    if (stored[key] !== undefined && typeof stored[key] !== 'boolean') changes[key] = initialState.Application[key]
  }
  if (stored.repeat !== undefined && (typeof stored.repeat !== 'number' || ![0, 1, 2].includes(stored.repeat))) changes.repeat = initialState.Application.repeat
  for (const key of ['currentTime', 'duration']) {
    const value = stored[key]
    if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value < 0)) changes[key] = 0
  }
  const queue = stored.currentPlaylist
  const ids = stored.audiosIds
  const activeTrack = stored.activeTrack
  const invalidQueue = (queue != null && !messageValidation.isPlaylist(queue)) || (ids !== undefined && !tuples(ids))
  if (invalidQueue) {
    Object.assign(changes, initialState.ApplicationActiveTrack, initialState.PlaylistSystem, initialState.CurrentTime)
  } else {
    if (stored.originalAudiosIds !== undefined && !tuples(stored.originalAudiosIds)) changes.originalAudiosIds = []
    if (activeTrack != null && !messageValidation.isTrack(activeTrack)) {
      Object.assign(changes, { activeTrack: null, activeTrackIndex: -1, playbackId: null, played: false, playbackRequested: false })
    } else if (messageValidation.isTrack(activeTrack) && tuples(ids)) {
      changes.activeTrackIndex = ids.findIndex(([id]) => id === activeTrack.id)
    }
  }
  return changes
}

let migrating: Promise<Partial<commonTypes.ApplicationState>> | undefined

export const migrateStoredState = (): Promise<Partial<commonTypes.ApplicationState>> => {
  migrating ??= serializeStateWrite(async () => {
    const stored = await chrome.storage.local.get()
    const changes = migrationChanges(stored)
    if (Object.keys(changes).length > 0) await chrome.storage.local.set(changes)
    return { ...stored, ...changes } as Partial<commonTypes.ApplicationState>
  }).finally(() => { migrating = undefined })
  return migrating
}

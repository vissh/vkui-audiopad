import { type commonTypes } from '@vk-audiopad/common'
import { applicationState } from './state'
import { sameQueue, type QueueEdit } from './queue'
import { serializeStateWrite } from './state-writer'

export const MAX_FAILED_TRACKS = 5
export const MAX_TRACK_ATTEMPTS = 3
export const MAX_PLAYBACK_ATTEMPTS = MAX_FAILED_TRACKS * MAX_TRACK_ATTEMPTS

export interface PlaybackOperation {
  identity: commonTypes.SessionIdentity
  controller: AbortController
  playlist: commonTypes.Playlist
  audiosIds: commonTypes.AudioTuple[]
  trackId: string | null
  visited: Set<string>
  attempts: number
  trackAttempts: Map<string, number>
  playbackId: string | null
  retryPending: boolean
  failed: boolean
  loading: boolean
  launched: boolean
  hydrating: boolean
  revision: number
  queueEdits: QueueEdit[]
}

let current: PlaybackOperation | null = null
// Storage events can lag behind commands; keep the latest intent synchronous.
let requested: boolean | undefined
let intentRevision = 0

export const getPlaybackIntentRevision = (): number => intentRevision

export const getRequestedPlayback = (): boolean => requested ?? applicationState.played

export const requestPlayback = (value: boolean): (() => boolean) => {
  requested = value
  const revision = ++intentRevision
  return () => revision === intentRevision
}

const ownsSession = (operation: PlaybackOperation): boolean => operation.identity.userId === applicationState.userId && operation.identity.epoch === applicationState.sessionEpoch

export const getPlaybackOperation = (): PlaybackOperation | null => current != null && ownsSession(current) ? current : null
export const isLatestPlayback = (operation: PlaybackOperation): boolean => current === operation && ownsSession(operation)
export const isRunningPlayback = (operation: PlaybackOperation): boolean => isLatestPlayback(operation) && !operation.controller.signal.aborted && !operation.failed

export const beginPlayback = (trackId: string | null, playlist: commonTypes.Playlist, audiosIds: commonTypes.AudioTuple[]): PlaybackOperation => {
  const previous = getPlaybackOperation()
  const continuesQueue = previous != null && sameQueue(previous.playlist, playlist) && previous.playlist.tracks.length === playlist.tracks.length && previous.playlist.tracks.every((track, index) => track.id === playlist.tracks[index].id)
  current?.controller.abort()
  current = {
    identity: { userId: applicationState.userId, epoch: applicationState.sessionEpoch },
    controller: new AbortController(),
    playlist: { ...playlist, tracks: [...playlist.tracks] },
    audiosIds: audiosIds.map(([id, key]) => [id, key]),
    trackId,
    visited: new Set(),
    attempts: 0,
    trackAttempts: new Map(),
    playbackId: null,
    retryPending: false,
    failed: false,
    loading: true,
    launched: false,
    hydrating: false,
    revision: 0,
    queueEdits: continuesQueue && previous?.hydrating === true ? [...previous.queueEdits] : []
  }
  return current
}

export const commitPlayback = (isCurrent: () => boolean, update: Partial<commonTypes.ApplicationState> | (() => Partial<commonTypes.ApplicationState> | null), onCommitted?: () => void): Promise<boolean> => {
  return serializeStateWrite(async () => {
    if (!isCurrent()) return false
    const changes = typeof update === 'function' ? update() : update
    if (changes == null) return false
    await chrome.storage.local.set(changes)
    if (!isCurrent()) return false
    Object.assign(applicationState, changes)
    onCommitted?.()
    return true
  })
}

export const isCurrentPlayer = (playbackId: string): boolean => {
  if (applicationState.playbackId !== playbackId) return false
  return current == null || (isRunningPlayback(current) && !current.retryPending && current.playbackId === playbackId)
}

export const waitForPlayback = async (operation: PlaybackOperation, ms: number): Promise<boolean> => {
  if (!isRunningPlayback(operation)) return false
  await new Promise<void>(resolve => {
    const done = (): void => {
      clearTimeout(timer)
      operation.controller.signal.removeEventListener('abort', done)
      resolve()
    }
    const timer = setTimeout(done, ms)
    operation.controller.signal.addEventListener('abort', done, { once: true })
  })
  return isRunningPlayback(operation)
}

export const cancelPlayback = (): void => {
  current?.controller.abort()
}

export const retirePlayback = (): void => {
  cancelPlayback()
  current = null
  requestPlayback(false)
}

export const restorePlayback = (playbackId: string): PlaybackOperation | null => {
  if (applicationState.currentPlaylist == null) return null
  const hydrating = current?.hydrating === true && sameQueue(current.playlist, applicationState.currentPlaylist)
  const operation = beginPlayback(applicationState.activeTrack?.id ?? null, applicationState.currentPlaylist, applicationState.audiosIds)
  operation.hydrating = hydrating
  operation.playbackId = playbackId
  operation.loading = false
  operation.launched = true
  operation.attempts = 1
  if (operation.trackId != null) {
    operation.visited.add(operation.trackId)
    operation.trackAttempts.set(operation.trackId, 1)
  }
  return operation
}

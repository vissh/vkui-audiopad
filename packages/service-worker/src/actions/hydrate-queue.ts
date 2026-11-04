import { fetchAudiosIdsBySource } from '../fetchers/audio-ids-by-source'
import { commitPlayback, isRunningPlayback, type PlaybackOperation } from '../playback-operation'
import { applyQueueEdits } from '../queue'
import { applicationState } from '../state'
import { shuffle } from '../utils'

export const hydrateQueue = async (operation: PlaybackOperation): Promise<void> => {
  if (!operation.hydrating) return
  const revision = operation.revision
  const isCurrent = (): boolean => isRunningPlayback(operation) && operation.revision === revision && operation.hydrating && !operation.retryPending
  try {
    const complete = await fetchAudiosIdsBySource(operation.playlist, operation.controller.signal)
    if (!isCurrent()) return
    await commitPlayback(isCurrent, () => {
      const track = applicationState.activeTrack
      const base = track == null || complete.some(([id]) => id === track.id) ? complete : [[track.id, track.accessKey] as [string, string], ...complete]
      const canonical = applyQueueEdits(base, operation.queueEdits)
      const ordered = applicationState.shuffle ? shuffle(canonical) : canonical
      return { activeTrackIndex: ordered.findIndex(([id]) => id === track?.id), audiosIds: ordered, originalAudiosIds: applicationState.shuffle ? canonical : [] }
    }, () => {
      operation.audiosIds = applicationState.audiosIds
      operation.hydrating = false
      operation.queueEdits = []
    })
  } catch {
    if (isCurrent()) console.warn('Could not load the remaining queue; playback continues')
  }
}

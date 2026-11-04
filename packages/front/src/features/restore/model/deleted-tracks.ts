import { commonTypes } from '@vk-audiopad/common'
import { onActiveTabChanged } from '@/shared/model'

const deletedTracks = new Map<string, commonTypes.TrackItem>()
let restoreWindow = 0

const removeFromQueue = (track: commonTypes.TrackItem): void => {
  void chrome.runtime.sendMessage({
    target: commonTypes.MessageTarget.SERVICE_WORKER,
    type: commonTypes.MessageType.DELETE_TRACK,
    track
  }).catch(() => { console.warn('Queue removal delivery failed') })
}

const add = (track: commonTypes.TrackItem, window = restoreWindow): void => {
  if (window !== restoreWindow) {
    removeFromQueue(track)
    return
  }
  deletedTracks.set(track.id, track)
}

export const deletedTrackForRestore = {
  window: (): number => restoreWindow,
  add,
  remove: (track: commonTypes.TrackItem): void => {
    deletedTracks.delete(track.id)
    removeFromQueue(track)
  },
  restore: async (track: commonTypes.TrackItem, action: () => Promise<void>): Promise<void> => {
    const window = restoreWindow
    const pending = deletedTracks.delete(track.id)
    try {
      await action()
    } catch (error) {
      if (pending) add(track, window)
      throw error
    }
  },
  clear: (): void => {
    const tracks = [...deletedTracks.values()]
    deletedTracks.clear()
    restoreWindow++
    tracks.forEach(removeFromQueue)
  }
}

onActiveTabChanged(activeTab => {
  if (activeTab.tab !== commonTypes.ContentTab.UNKNOWN) deletedTrackForRestore.clear()
})

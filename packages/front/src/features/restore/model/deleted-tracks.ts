import { commonTypes } from '@vk-audiopad/common'
import { sendMessage } from '@/shared/lib/send-message'
import { onActiveTabChanged } from '@/shared/model'

const deletedTracks = new Map<string, commonTypes.TrackItem>()

export const deletedTrackForRestore = {
  add: (track: commonTypes.TrackItem): void => {
    deletedTracks.set(track.id, track)
  },

  pop: (track: commonTypes.TrackItem): void => {
    deletedTracks.delete(track.id)
  },

  clear: (): void => {
    Object.values(deletedTracks).forEach((track) => {
      sendMessage({ target: commonTypes.MessageType.SERVICE_WORKER, type: 'delete-track', track })
    })

    Array.from(deletedTracks.keys()).forEach(trackId => {
      deletedTracks.delete(trackId)
    })
  }
}

onActiveTabChanged((activeTab) => {
  if (activeTab.tab !== commonTypes.ContentTab.UNKNOWN) {
    deletedTrackForRestore.clear()
  }
})

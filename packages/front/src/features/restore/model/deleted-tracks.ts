import { commonTypes } from '@vk-audiopad/common'
import { onActiveTabChanged } from '@/entities/active-tab'
import { sendMessage } from '@/shared/lib/send-message'

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
      sendMessage({ type: 'delete-track', track })
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

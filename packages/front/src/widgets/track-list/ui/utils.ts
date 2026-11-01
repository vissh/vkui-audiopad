import { commonTypes } from '@vk-audiopad/common'
import { type ActionButton, type TrackState } from '@/entities/track'

export const getTrackState = (
  track: commonTypes.TrackItem,
  activeTrack: commonTypes.TrackItem | null,
  played: boolean
): TrackState => {
  const isActive = (activeTrack != null) && activeTrack.id === track.id
  const isPlayed = isActive && played
  const isClaimed = (track.flags & commonTypes.TrackFlagBit.CLAIMED) !== 0
  return isClaimed ? 'disabled' : isActive ? (isPlayed ? 'played' : 'paused') : 'normal'
}

interface ActionButtonArgs {
  userId: string
  track: commonTypes.TrackItem
  trackState: TrackState
  activeTrack: commonTypes.TrackItem | null
  currentPlaylistExists: boolean
  addedToMyMusic: boolean
  deletedFromMyMusic: boolean
}

export const getActionButtons = ({
  userId,
  track,
  trackState,
  activeTrack,
  currentPlaylistExists,
  addedToMyMusic,
  deletedFromMyMusic
}: ActionButtonArgs): Set<ActionButton> => {
  const trackUserId = track.id.split('_')[0]
  const isOwner = trackUserId === userId
  const canAdd = (track.flags & commonTypes.TrackFlagBit.CAN_ADD) !== 0

  const actionButtons = new Set<ActionButton>()

  if (deletedFromMyMusic) {
    actionButtons.add('restore')
  } else if (trackState !== 'disabled') {
    if (currentPlaylistExists && activeTrack?.id !== track.id && (track.duration !== 0)) {
      actionButtons.add('addToQueue')
    }

    if (isOwner) {
      actionButtons.add(addedToMyMusic ? 'delete' : 'deleteWithRestore')
    } else if (canAdd) {
      actionButtons.add('add')
    }

    if (track.duration !== 0) {
      actionButtons.add('similar')
    }
  }

  return actionButtons
}

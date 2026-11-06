import { commonTypes } from '@vk-audiopad/common'
import { Icon20MusicNoteWaveOutline, Icon24MusicNoteWaveOutline } from '@vkontakte/icons'
import { useSessionUserId } from '@/entities/session'
import { sendMessage } from '@/shared/lib/send-message'
import { TooltipIconButton } from '@/shared/ui/tooltip-icon-button'

export const TrackMixButton = ({ track, size = 'm' }: { track: commonTypes.TrackItem, size?: 's' | 'm' }) => {
  const userId = useSessionUserId()
  if (userId.length === 0 || !/^-?[1-9]\d*_[1-9]\d*$/.test(track.id) || (track.flags & commonTypes.TrackFlagBit.CLAIMED) !== 0) return null
  const play = () => {
    const playlist: commonTypes.Playlist = {
      id: `track-mix-${track.id}`,
      ownerId: userId,
      blockId: '',
      title: `Микс по треку «${track.title}»`,
      tracks: [],
      isRadio: false,
      isVkMix: true,
      mixId: 'track_mix',
      mixEntityId: track.id,
      accessHash: '',
      nextOffset: '',
      hasMore: false,
      followHash: '',
      isFollowed: false
    }
    sendMessage({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.ACTIVE_TRACK, trackId: null, playlist })
  }
  return <TooltipIconButton text='Микс по треку' icon={size === 's' ? Icon20MusicNoteWaveOutline : Icon24MusicNoteWaveOutline} onClick={play} />
}

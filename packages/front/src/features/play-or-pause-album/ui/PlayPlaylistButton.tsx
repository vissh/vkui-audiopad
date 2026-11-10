import { type commonTypes } from '@vk-audiopad/common'
import { Icon36Pause, Icon36Play } from '@vkontakte/icons'
import { type FC } from 'react'
import { usePlaylistPlayback } from '@/entities/active-track'
import { fetchPlaylist } from '@/shared/api'
import { AsyncTooltipIconButton } from '@/shared/ui/tooltip-icon-button'
import { usePlaylistSelection } from '../model/selection'

const PlayIcon: FC<{ className?: string }> = props => <Icon36Play {...props} width={48} height={48} />
const PauseIcon: FC<{ className?: string }> = props => <Icon36Pause {...props} width={48} height={48} />

export const PlayPlaylistButton: FC<{ userId: string, album: commonTypes.Playlist }> = ({ userId, album }) => {
  const playback = usePlaylistPlayback(album)
  const active = playback != null
  const pause = playback === 'played'

  const play = usePlaylistSelection(album, userId, active, async signal => {
    const { playlist } = await fetchPlaylist({ fromId: userId, playlist: album }, signal)
    return playlist
  })

  return (
    <AsyncTooltipIconButton
      text={`${pause ? 'Приостановить' : 'Воспроизвести'}: ${album.title}`}
      icon={pause ? PauseIcon : PlayIcon}
      tooltipShown={false}
      hoverMode='none'
      activeMode='none'
      onClick={play}
      errorMessage='Не удалось запустить подборку. Повторите попытку'
    />
  )
}

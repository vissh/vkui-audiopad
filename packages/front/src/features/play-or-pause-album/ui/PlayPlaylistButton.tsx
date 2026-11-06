import { Icon36Pause, Icon36Play } from '@vkontakte/icons'
import { type FC } from 'react'
import { useCurrentPlaylist, usePlaybackRequested } from '@/entities/active-track'
import { fetchPlaylist } from '@/shared/api'
import { type Album } from '@/shared/types'
import { AsyncTooltipIconButton } from '@/shared/ui/tooltip-icon-button'
import { usePlaylistSelection } from '../model/selection'

const PlayIcon: FC<{ className?: string }> = props => <Icon36Play {...props} width={48} height={48} />
const PauseIcon: FC<{ className?: string }> = props => <Icon36Pause {...props} width={48} height={48} />

export const PlayPlaylistButton: FC<{ userId: string, album: Album }> = ({ userId, album }) => {
  const currentPlaylist = useCurrentPlaylist()
  const requested = usePlaybackRequested()
  const active = currentPlaylist != null && currentPlaylist.id === album.id && currentPlaylist.ownerId === album.ownerId && currentPlaylist.blockId === album.blockId
  const pause = active && requested

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

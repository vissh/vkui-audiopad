import { commonTypes } from '@vk-audiopad/common'
import { Icon36Pause, Icon36Play } from '@vkontakte/icons'
import { useEffect, useRef, type FC } from 'react'
import { useCurrentPlaylist, usePlaybackRequested } from '@/entities/active-track'
import { fetchPlaylist } from '@/shared/api'
import { sendMessage } from '@/shared/lib/send-message'
import { type Album } from '@/shared/types'
import { AsyncTooltipIconButton } from '@/shared/ui/tooltip-icon-button'

let pendingSelection: AbortController | null = null

const PlayIcon: FC<{ className?: string }> = props => <Icon36Play {...props} width={48} height={48} />
const PauseIcon: FC<{ className?: string }> = props => <Icon36Pause {...props} width={48} height={48} />

export const PlayPlaylistButton: FC<{ userId: string, album: Album }> = ({ userId, album }) => {
  const currentPlaylist = useCurrentPlaylist()
  const requested = usePlaybackRequested()
  const request = useRef<AbortController | null>(null)
  useEffect(() => () => { request.current?.abort() }, [userId, album])
  const active = currentPlaylist != null && currentPlaylist.id === album.id && currentPlaylist.ownerId === album.ownerId && currentPlaylist.blockId === album.blockId
  const pause = active && requested

  const play = async () => {
    pendingSelection?.abort()
    pendingSelection = null
    if (active) {
      sendMessage({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.TOGGLE_PLAYBACK })
      return
    }
    const controller = new AbortController()
    pendingSelection = controller
    request.current = controller
    try {
      const { playlist } = await fetchPlaylist({ fromId: userId, playlist: album }, controller.signal)
      if (controller.signal.aborted) return
      if (playlist.tracks.length === 0) throw new Error('Empty playlist')
      sendMessage({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.ACTIVE_TRACK, trackId: null, playlist })
    } catch (error) {
      if (!controller.signal.aborted) throw error
    } finally {
      if (pendingSelection === controller) pendingSelection = null
      if (request.current === controller) request.current = null
    }
  }

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

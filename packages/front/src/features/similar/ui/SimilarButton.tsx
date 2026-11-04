import { type commonTypes } from '@vk-audiopad/common'
import { Icon20Stars, Icon24StarsOutline } from '@vkontakte/icons'
import { type FC } from 'react'
import { openPlaylistPage, showNotification } from '@/shared/model'
import { AsyncTooltipIconButton } from '@/shared/ui/tooltip-icon-button'
import { fetchSimilarData } from '../api/similar'
import { SimilarTracksNotFound } from './SimilarTracksNotFound'

interface SimilarButtonProps {
  userId: string
  track: commonTypes.TrackItem
  size?: 's' | 'm'
  padding?: boolean
}

export const SimilarButton: FC<SimilarButtonProps> = ({ userId, track, size = 'm', padding }) => {
  const findSimilar = async () => {
    const playlist = await fetchSimilarData(userId, track)

    if (playlist == null) {
      showNotification(<SimilarTracksNotFound />)
      return
    }

    openPlaylistPage(userId, playlist, true)
  }

  return (
    <AsyncTooltipIconButton
      padding={padding}
      text='Показать похожие'
      icon={{ s: Icon20Stars, m: Icon24StarsOutline }[size]}
      onClick={findSimilar}
      errorMessage='Не удалось найти похожие треки. Повторите попытку.'
    />
  )
}

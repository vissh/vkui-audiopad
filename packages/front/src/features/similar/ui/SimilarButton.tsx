import { type commonTypes } from '@vk-audiopad/common'
import { Icon20Stars, Icon24StarsOutline } from '@vkontakte/icons'
import { useState, type FC } from 'react'
import { openPlaylistPage } from '@/entities/content-tab'
import { setSnackbar } from '@/entities/snackbar'
import { Spinner24 } from '@/shared/ui/spinner/Spinner24'
import { TooltipIconButton } from '@/shared/ui/tooltip-icon-button'
import { fetchSimilarData } from '../api/similar'
import { SimilarTracksNotFound } from './SimilarTracksNotFound'

interface SimilarButtonProps {
  userId: string
  track: commonTypes.TrackItem
  size?: 's' | 'm'
  padding?: boolean
}

export const SimilarButton: FC<SimilarButtonProps> = ({ userId, track, size = 'm', padding }) => {
  const [loading, setLoading] = useState(false)

  const findSimilar = async () => {
    setLoading(true)
    const playlist = await fetchSimilarData(userId, track)
    setLoading(false)

    if (playlist == null) {
      setSnackbar(<SimilarTracksNotFound />)
      return
    }

    openPlaylistPage(userId, playlist, true)
  }

  return (
    <>
      {loading
        ? <Spinner24
          size={size}
          padding={padding}
        />
        : <TooltipIconButton
          padding={padding}
          text='Показать похожие'
          icon={{ s: Icon20Stars, m: Icon24StarsOutline }[size]}
          onClick={() => { void findSimilar() }}
        />
      }
    </>
  )
}

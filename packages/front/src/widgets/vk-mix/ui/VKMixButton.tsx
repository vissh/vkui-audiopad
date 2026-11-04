import { Icon24Pause, Icon24Play } from '@vkontakte/icons'
import { Button, useColorScheme } from '@vkontakte/vkui'
import { useState, type CSSProperties, type FC } from 'react'
import { playOrPause } from '@/features/play-or-pause'
import { useCurrentPlaylist, usePlaybackRequested } from '@/entities/active-track'

export const VKMixButton: FC = () => {
  const currentPlaylist = useCurrentPlaylist()
  const played = usePlaybackRequested()
  const vkMixPlayed = currentPlaylist != null && currentPlaylist.isVkMix && played

  const colorScheme = useColorScheme()
  const [hovered, setHovered] = useState(false)

  const styles = hovered
    ? (colorScheme === 'light' ? buttonLightHoverStyle : buttonDarkHoverStyle)
    : (colorScheme === 'light' ? buttonLightStyle : buttonDarkStyle)

  return (
    <Button
      after={vkMixPlayed ? <Icon24Pause /> : <Icon24Play />}
      rounded={true}
      size='l'
      style={styles}
      onPointerEnter={() => { setHovered(true) }}
      onPointerLeave={() => { setHovered(false) }}
      onClick={() => {
        if (currentPlaylist != null && currentPlaylist.isVkMix) {
          playOrPause(played ? 'played' : 'paused', null, currentPlaylist)
        } else {
          const vkMixPlaylist = {
            id: (+new Date().getTime()).toString(),
            blockId: '',
            title: '',
            tracks: [],
            isRadio: false,
            isVkMix: true,
            accessHash: '',
            ownerId: '',
            nextOffset: '',
            hasMore: false,
            followHash: '',
            isFollowed: false
          }
          playOrPause('normal', null, vkMixPlaylist)
        }
      }}
    />
  )
}

const buttonLightStyle: CSSProperties = {
  color: 'black',
  backgroundColor: 'var(--vkui--color_background_content)'
}

const buttonDarkStyle: CSSProperties = {
  color: 'white',
  backgroundColor: 'var(--vkui--color_background_content)'
}

const buttonLightHoverStyle: CSSProperties = {
  color: 'black',
  backgroundColor: 'var(--vkui--color_background_content--hover)'
}

const buttonDarkHoverStyle: CSSProperties = {
  color: 'white',
  backgroundColor: 'var(--vkui--color_background_content--hover)'
}

import { Icon24Pause, Icon24Play } from '@vkontakte/icons'
import { Button, useColorScheme } from '@vkontakte/vkui'
import { useEffect, useState, type CSSProperties, type FC } from 'react'
import { playOrPause } from '@/features/play-or-pause'
import { setPlayed, useCurrentPlaylist, usePlayed } from '@/entities/active-track'

export const VKMixButton: FC = () => {
  const currentPlaylist = useCurrentPlaylist()
  const played = usePlayed()
  const vkMixPlayed = currentPlaylist != null && currentPlaylist.isVkMix && played

  const colorScheme = useColorScheme()
  const [styles, setStyles] = useState<CSSProperties>(colorScheme === 'light' ? buttonLightStyle : buttonDarkStyle)

  useEffect(() => {
    setStyles(colorScheme === 'light' ? buttonLightStyle : buttonDarkStyle)
  }, [colorScheme])

  return (
    <Button
      after={vkMixPlayed ? <Icon24Pause /> : <Icon24Play />}
      rounded={true}
      size={'l'}
      style={styles}
      onPointerEnter={() => { setStyles(colorScheme === 'light' ? buttonLightHoverStyle : buttonDarkHoverStyle) }}
      onPointerLeave={() => { setStyles(colorScheme === 'light' ? buttonLightStyle : buttonDarkStyle) }}
      onClick={() => {
        if (currentPlaylist != null && currentPlaylist.isVkMix) {
          setPlayed(!played)
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

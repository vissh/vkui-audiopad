import { commonTypes } from '@vk-audiopad/common'
import { Icon24Pause, Icon24Play } from '@vkontakte/icons'
import { Button, useColorScheme } from '@vkontakte/vkui'
import { useState, type CSSProperties, type FC } from 'react'
import { usePlaybackSelection, usePlaybackRequested } from '@/entities/active-track'
import { useMixPreferences } from '@/entities/vk-mix'
import { sendMessage } from '@/shared/lib/send-message'
import { playMix } from '../model/play-mix'

export const VKMixButton: FC<{ userId: string }> = ({ userId }) => {
  const selected = usePlaybackSelection()
  const played = usePlaybackRequested()
  const preferences = useMixPreferences(userId)
  const vkMixPlayed = selected?.isVkMix === true && (selected.mixId ?? 'common') === 'common' && played

  const colorScheme = useColorScheme()
  const [hovered, setHovered] = useState(false)

  const styles = hovered
    ? (colorScheme === 'light' ? buttonLightHoverStyle : buttonDarkHoverStyle)
    : (colorScheme === 'light' ? buttonLightStyle : buttonDarkStyle)

  return (
    <Button
      after={vkMixPlayed ? <Icon24Pause /> : <Icon24Play />}
      aria-label={vkMixPlayed ? 'Приостановить VK Микс' : 'Воспроизвести VK Микс'}
      rounded={true}
      size='l'
      style={styles}
      onPointerEnter={() => { setHovered(true) }}
      onPointerLeave={() => { setHovered(false) }}
      onClick={() => {
        if (selected?.isVkMix === true && (selected.mixId ?? 'common') === 'common') {
          sendMessage({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.TOGGLE_PLAYBACK })
        } else {
          playMix(userId, preferences?.options, preferences?.title)
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

import { commonTypes } from '@vk-audiopad/common'
import { Icon24Dismiss, Icon28ErrorCircleOutline } from '@vkontakte/icons'
import { Button, Footnote, IconButton, Title } from '@vkontakte/vkui'
import { useState, type FC } from 'react'
import { usePlaybackInitialization } from '@/entities/active-track'
import { sendMessage } from '@/shared/lib/send-message'
import './PlaybackErrorNotice.css'

export const PlaybackErrorNotice: FC<{ error: string }> = ({ error }) => {
  const initialization = usePlaybackInitialization()
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className='vkap_playback_notice' role='status' aria-live='polite'>
      <div className='vkap_playback_notice_icon'><Icon28ErrorCircleOutline /></div>
      <div className='vkap_playback_notice_content'>
        <Title level='3' className='vkap_playback_notice_title'>Воспроизведение остановлено</Title>
        <Footnote className='vkap_playback_notice_description'>{error}</Footnote>
        {initialization !== 'failed' &&
          <Button
            size='s'
            mode='secondary'
            onClick={() => {
              sendMessage({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.PLAY_OR_PAUSE, played: true })
            }}
          >
            Попробовать снова
          </Button>}
      </div>
      <IconButton aria-label='Скрыть сообщение' onClick={() => { setDismissed(true) }}><Icon24Dismiss /></IconButton>
    </div>
  )
}

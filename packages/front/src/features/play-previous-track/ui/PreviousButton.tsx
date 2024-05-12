import { commonTypes } from '@vk-audiopad/common'
import { Icon20SkipBack } from '@vkontakte/icons'
import { IconButton } from '@vkontakte/vkui'
import { type FC } from 'react'
import { sendMessage } from '@/shared/lib/send-message'

export const PreviousButton: FC = () => {
  return (
    <IconButton
      hasHover={false}
      onClick={() => {
        sendMessage({
          target: commonTypes.MessageTarget.SERVICE_WORKER,
          type: commonTypes.MessageType.PREVIOUS_TRACK
        })
      }}
      style={{ height: 48 }}
    >
      <Icon20SkipBack />
    </IconButton>
  )
}

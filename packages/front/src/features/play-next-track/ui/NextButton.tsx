import { Icon20SkipForward } from '@vkontakte/icons'
import { IconButton } from '@vkontakte/vkui'
import { type FC } from 'react'
import { sendMessage } from '@/shared/lib/send-message'

export const NextButton: FC = () => {
  return (
    <IconButton
      hasHover={false}
      onClick={() => { sendMessage({ type: 'next-track' }) }}
      style={{ height: 48 }}
    >
      <Icon20SkipForward />
    </IconButton>
  )
}

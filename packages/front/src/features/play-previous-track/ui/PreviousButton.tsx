import { Icon20SkipBack } from '@vkontakte/icons'
import { IconButton } from '@vkontakte/vkui'
import { type FC } from 'react'
import { sendMessage } from '@/shared/lib/send-message'

export const PreviousButton: FC = () => {
  return (
    <IconButton
      hasHover={false}
      onClick={() => { sendMessage({ type: 'previous-track' }) }}
      style={{ height: 48 }}
    >
      <Icon20SkipBack />
    </IconButton>
  )
}

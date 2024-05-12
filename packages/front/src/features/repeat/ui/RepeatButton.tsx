import { commonTypes } from '@vk-audiopad/common'
import { Icon24Repeat1Outline, Icon24RepeatOutline } from '@vkontakte/icons'
import { type FC } from 'react'
import { useAtomValue } from '@/shared/lib/atom'
import { sendMessage } from '@/shared/lib/send-message'
import { TooltipIconButton } from '@/shared/ui/tooltip-icon-button'
import { repeatAtom } from '../model/atom'

export const RepeatButton: FC = () => {
  const repeat = useAtomValue(repeatAtom)

  return (
    <>
      {repeat === commonTypes.RepeatMode.NONE && (
        <TooltipIconButton
          padding
          text='Повторять'
          icon={Icon24RepeatOutline}
          onClick={setRepeat}
        />
      )}
      {repeat === commonTypes.RepeatMode.REPEAT && (
        <TooltipIconButton
          accent
          padding
          text='Повторять композицию'
          icon={Icon24RepeatOutline}
          onClick={setRepeat}
        />
      )}
      {repeat === commonTypes.RepeatMode.REPEAT_ONE && (
        <TooltipIconButton
          accent
          padding
          text='Не повторять композицию'
          icon={Icon24Repeat1Outline}
          onClick={setRepeat}
        />
      )}
    </>
  )
}

const setRepeat = (): void => {
  sendMessage({
    target: commonTypes.MessageTarget.SERVICE_WORKER,
    type: commonTypes.MessageType.REPEAT
  })
}

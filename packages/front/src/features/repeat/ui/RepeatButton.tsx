import { commonTypes } from '@vk-audiopad/common'
import { Icon24Repeat1Outline, Icon24RepeatOutline } from '@vkontakte/icons'
import { type FC } from 'react'
import { useAtomValue } from '@/shared/lib/atom'
import { sendMessage } from '@/shared/lib/send-message'
import { TooltipIconButton } from '@/shared/ui/tooltip-icon-button'
import { repeatAtom } from '../model/atom'

export const RepeatButton: FC = () => {
  const repeat = useAtomValue(repeatAtom)

  const enabled = repeat !== commonTypes.RepeatMode.NONE
  const singleTrack = repeat === commonTypes.RepeatMode.REPEAT_ONE

  return (
    <TooltipIconButton
      accent={enabled}
      padding
      text={singleTrack ? 'Не повторять композицию' : enabled ? 'Повторять композицию' : 'Повторять'}
      description={singleTrack ? 'Повтор одного трека включён' : enabled ? 'Повтор плейлиста включён' : 'Повтор выключен'}
      icon={singleTrack ? Icon24Repeat1Outline : Icon24RepeatOutline}
      onClick={setRepeat}
    />
  )
}

const setRepeat = (): void => {
  sendMessage({
    target: commonTypes.MessageTarget.SERVICE_WORKER,
    type: commonTypes.MessageType.REPEAT
  })
}

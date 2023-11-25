import { commonTypes } from '@vk-audiopad/common'
import { Icon24Repeat1Outline, Icon24RepeatOutline } from '@vkontakte/icons'
import { type FC } from 'react'
import { setRepeat, useRepeat } from '@/entities/controls'
import { TooltipIconButton } from '@/shared/ui/tooltip-icon-button'

export const RepeatButton: FC = () => {
  const repeat = useRepeat()

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

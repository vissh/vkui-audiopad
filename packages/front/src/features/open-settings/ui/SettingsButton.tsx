import { Icon24GearOutline } from '@vkontakte/icons'
import { type FC } from 'react'
import { setInfoModal } from '@/entities/modal'
import { TooltipIconButton } from '@/shared/ui/tooltip-icon-button'

export const SettingButton: FC = () => {
  return (
    <TooltipIconButton
      padding
      text='Настройки'
      icon={Icon24GearOutline}
      onClick={setInfoModal}
    />
  )
}

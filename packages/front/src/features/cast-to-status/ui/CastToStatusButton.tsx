import { Icon28RadiowavesLeftAndRightOutline } from '@vkontakte/icons'
import { type FC } from 'react'
import { useAtom } from '@/shared/lib/atom'
import { TooltipIconButton } from '@/shared/ui/tooltip-icon-button'
import { castToStatusAtom } from '../model/atom'

export const CastToStatusButton: FC = () => {
  const [castToStatus, setCastToStatus] = useAtom(castToStatusAtom)

  const toggle = () => {
    setCastToStatus(!castToStatus)
  }

  return (
    <TooltipIconButton
      accent={castToStatus}
      className='vkap_broadcast_button'
      pressed={castToStatus}
      padding
      text='Транслировать музыку в статус'
      icon={Icon28RadiowavesLeftAndRightOutline}
      onClick={toggle}
    />
  )
}

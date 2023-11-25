import { Icon24ShuffleOutline } from '@vkontakte/icons'
import { type FC } from 'react'
import { setShuffle, useShuffle } from '@/entities/controls'
import { TooltipIconButton } from '@/shared/ui/tooltip-icon-button'

export const ShuffleButton: FC = () => {
  const shuffle = useShuffle()

  const changeShuffleMode = () => {
    setShuffle(!shuffle)
  }

  return (
    <>
      {shuffle
        ? <TooltipIconButton
          accent
          padding
          text='Перемешать'
          icon={Icon24ShuffleOutline}
          onClick={changeShuffleMode}
        />
        : <TooltipIconButton
          padding
          text='Перемешать'
          icon={Icon24ShuffleOutline}
          onClick={changeShuffleMode}
        />
      }
    </>
  )
}

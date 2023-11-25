import { Icon24ShuffleOutline } from '@vkontakte/icons'
import { type FC } from 'react'
import { useAtom } from '@/shared/lib/atom'
import { TooltipIconButton } from '@/shared/ui/tooltip-icon-button'
import { shuffleAtom } from '../model/atom'

export const ShuffleButton: FC = () => {
  const [shuffle, setShuffle] = useAtom(shuffleAtom)

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

import { commonTypes } from '@vk-audiopad/common'
import { Icon24ShuffleOutline } from '@vkontakte/icons'
import { type FC } from 'react'
import { useAtomValue } from '@/shared/lib/atom'
import { sendMessage } from '@/shared/lib/send-message'
import { TooltipIconButton } from '@/shared/ui/tooltip-icon-button'
import { shuffleAtom } from '../model/atom'

export const ShuffleButton: FC = () => {
  const shuffle = useAtomValue(shuffleAtom)

  const changeShuffleMode = () => {
    sendMessage({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.TOGGLE_SHUFFLE })
  }

  return (
    <>
      {shuffle
        ? <TooltipIconButton
            accent
            pressed
            padding
            text='Перемешать'
            icon={Icon24ShuffleOutline}
            onClick={changeShuffleMode}
          />
        : <TooltipIconButton
            pressed={false}
            padding
            text='Перемешать'
            icon={Icon24ShuffleOutline}
            onClick={changeShuffleMode}
          />}
    </>
  )
}

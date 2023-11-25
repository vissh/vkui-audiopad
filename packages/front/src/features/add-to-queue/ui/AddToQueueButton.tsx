import { type commonTypes } from '@vk-audiopad/common'
import { Icon20ListAddOutline, Icon20ListPlayOutline } from '@vkontakte/icons'
import { useState, type FC } from 'react'
import { sendMessage } from '@/shared/lib/send-message'
import { TooltipIconButton } from '@/shared/ui/tooltip-icon-button'

interface AddToQueueButtonProps {
  track: commonTypes.TrackItem
}

export const AddToQueueButton: FC<AddToQueueButtonProps> = ({ track }) => {
  const [added, setAdded] = useState(false)

  return (
    <>
      {added
        ? <TooltipIconButton
          text='Воспроизвести следующей'
          icon={Icon20ListAddOutline}
        />
        : <TooltipIconButton
          text='Воспроизвести следующей'
          icon={Icon20ListPlayOutline}
          onClick={() => {
            sendMessage({ type: 'add-to-queue', track })
            setAdded(true)
          }}
        />
      }
    </>
  )
}

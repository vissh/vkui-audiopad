import { type commonTypes } from '@vk-audiopad/common'
import { Icon20Check, Icon24DoneOutline } from '@vkontakte/icons'
import { type FC } from 'react'
import { TooltipIconButton } from '@/shared/ui/tooltip-icon-button'
import { vkApiDelete } from '../api/delete'

interface DeleteFromMyMusicButtonProps {
  track: commonTypes.TrackItem
  size?: 's' | 'm'
  onAfterDelete: () => void
}

export const DeleteFromMyMusicButton: FC<DeleteFromMyMusicButtonProps> = ({ track, size = 'm', onAfterDelete }) => {
  const Icon = {
    s: Icon20Check,
    m: Icon24DoneOutline
  }[size]

  const padding = {
    s: false,
    m: true
  }[size]

  const deleteFromMyMusic = async () => {
    await vkApiDelete(track)
    onAfterDelete()
  }

  return (
    <TooltipIconButton
      padding={padding}
      text='Удалить аудиозапись'
      icon={Icon}
      onClick={() => { void deleteFromMyMusic() }}
    />
  )
}

import { type commonTypes } from '@vk-audiopad/common'
import { Icon20Add, Icon24AddOutline } from '@vkontakte/icons'
import { type FC } from 'react'
import { TooltipIconButton } from '@/shared/ui/tooltip-icon-button'
import { vkApiAdd } from '../api/add'

interface AddToMyMusicButtonProps {
  track: commonTypes.TrackItem
  size?: 's' | 'm'
  onAfterAdd: (newTrack: commonTypes.TrackItem) => void
}

export const AddToMyMusicButton: FC<AddToMyMusicButtonProps> = ({ track, size = 'm', onAfterAdd }) => {
  const Icon = {
    s: Icon20Add,
    m: Icon24AddOutline
  }[size]

  const padding = {
    s: false,
    m: true
  }[size]

  const addToMyMusic = async () => {
    const newTrack = await vkApiAdd(track)
    onAfterAdd(newTrack)
  }

  return (
    <TooltipIconButton
      padding={padding}
      text='Добавить в мою музыку'
      icon={Icon}
      onClick={() => { void addToMyMusic() }}
    />
  )
}

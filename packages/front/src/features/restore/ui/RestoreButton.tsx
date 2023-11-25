import { type commonTypes } from '@vk-audiopad/common'
import { Icon20Add } from '@vkontakte/icons'
import { type FC } from 'react'
import { TooltipIconButton } from '@/shared/ui/tooltip-icon-button'
import { vkApiRestore } from '../api/restore'
import { deletedTrackForRestore } from '../model/deleted-tracks'

interface RestoreButtonProps {
  track: commonTypes.TrackItem
  onAfterRestore: () => void
}

export const RestoreButton: FC<RestoreButtonProps> = ({ track, onAfterRestore }) => {
  const restore = async () => {
    await vkApiRestore(track)
    deletedTrackForRestore.pop(track)
    onAfterRestore()
  }

  return (
    <TooltipIconButton
      text='Восстановить аудиозапись'
      icon={Icon20Add}
      onClick={() => { void restore() }}
    />
  )
}

import { type commonTypes } from '@vk-audiopad/common'
import { Icon20Add } from '@vkontakte/icons'
import { type FC } from 'react'
import { AsyncTooltipIconButton } from '@/shared/ui/tooltip-icon-button'
import { vkApiRestore } from '../api/restore'
import { deletedTrackForRestore } from '../model/deleted-tracks'

interface RestoreButtonProps {
  track: commonTypes.TrackItem
  onAfterRestore: () => void
}

export const RestoreButton: FC<RestoreButtonProps> = ({ track, onAfterRestore }) => {
  const restore = async () => {
    await deletedTrackForRestore.restore(track, async () => { await vkApiRestore(track) })
    onAfterRestore()
  }

  return (
    <AsyncTooltipIconButton
      text='Восстановить аудиозапись'
      icon={Icon20Add}
      errorMessage='Не удалось восстановить аудиозапись. Проверьте библиотеку VK перед повторной попыткой.'
      onClick={restore}
    />
  )
}

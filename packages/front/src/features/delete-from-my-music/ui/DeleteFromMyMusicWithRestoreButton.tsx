import { type commonTypes } from '@vk-audiopad/common'
import { Icon20Cancel } from '@vkontakte/icons'
import { type FC } from 'react'
import { AsyncTooltipIconButton } from '@/shared/ui/tooltip-icon-button'
import { vkApiDeleteWithRestore } from '../api/delete'

interface DeleteFromMyMusicWithRestoreButtonProps {
  track: commonTypes.TrackItem
  onAfterDelete: () => void
}

export const DeleteFromMyMusicWithRestoreButton: FC<DeleteFromMyMusicWithRestoreButtonProps> = ({
  track,
  onAfterDelete
}) => {
  const deleteFromMyMusic = async () => {
    await vkApiDeleteWithRestore(track)
    onAfterDelete()
  }

  return (
    <AsyncTooltipIconButton
      text='Удалить из моей музыки'
      icon={Icon20Cancel}
      errorMessage='Не удалось удалить аудиозапись. Проверьте библиотеку VK перед повторной попыткой.'
      onClick={deleteFromMyMusic}
    />
  )
}

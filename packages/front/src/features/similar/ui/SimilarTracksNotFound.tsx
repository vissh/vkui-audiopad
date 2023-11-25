import { Icon28InfoCircleOutline } from '@vkontakte/icons'
import { Snackbar } from '@vkontakte/vkui'
import { type FC } from 'react'
import { showNotification } from '@/entities/notification'

export const SimilarTracksNotFound: FC = () => {
  return (
    <Snackbar
      duration={3400}
      subtitle='Попробуйте другую аудиозапись'
      onClose={() => { showNotification(null) }}
      before={<Icon28InfoCircleOutline fill="var(--vkui--color_icon_accent)" />}
    >
      Мы не смогли найти ничего похожего
    </Snackbar>
  )
}

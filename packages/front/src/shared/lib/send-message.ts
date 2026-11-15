import { commandClient, type commonTypes } from '@vk-audiopad/common'
import { Snackbar } from '@vkontakte/vkui'
import { createElement } from 'react'
import { showNotification } from '../model/notification-atom'

export const sendMessage = async (message: commonTypes.PlayerCommand): Promise<commonTypes.CommandReply> => {
  const reply = await commandClient.requestCommand(message)
  if (!reply.ok || reply.outcome === 'ignored') {
    showNotification(createElement(Snackbar, { onClosed: () => { showNotification(null) } }, reply.ok
      ? 'Очередь изменилась. Повторите действие'
      : 'Не удалось подтвердить выполнение действия. Проверьте состояние плеера'))
  }
  return reply
}

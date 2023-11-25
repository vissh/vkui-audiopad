import { type commonTypes } from '@vk-audiopad/common'

export const sendMessage = (message: commonTypes.Messages) => {
  void chrome.runtime.sendMessage(message)
}

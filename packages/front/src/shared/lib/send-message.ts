import { type commonTypes } from '@vk-audiopad/common'

export const sendMessage = (message: commonTypes.Message) => {
  void chrome.runtime.sendMessage(message)
}

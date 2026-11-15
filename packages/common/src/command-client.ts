import { serializeError } from 'serialize-error'
import { MessageType, type PlayerCommand, type CommandRequest, type CommandReply } from './types'
import { isCommandReply } from './message-validation'
import { addBackgroundMessageListener, sendBackgroundMessage } from './utils'
import { withTimeout } from './with-timeout'
import { isObject } from './session-client'

export const TIMEOUT_MS = 30_000
export const failedReply = (requestId: string): CommandReply => ({ requestId, ok: false, error: serializeError(new Error('Command could not be applied')) })

export const requestCommand = async (command: PlayerCommand, background = false, signal?: AbortSignal): Promise<CommandReply> => {
  const requestId = crypto.randomUUID()
  const message: CommandRequest = { ...command, requestId, expiresAt: Date.now() + TIMEOUT_MS }
  try {
    return await withTimeout(async signal => {
      let response: unknown
      if (background) {
        response = await new Promise<unknown>((resolve, reject) => {
          const remove = addBackgroundMessageListener(message => {
            if (isObject(message) && message.type === MessageType.COMMAND_REPLY && isCommandReply(message.reply) && message.reply.requestId === requestId) {
              cleanup()
              resolve(message.reply)
            }
          })
          const aborted = (): void => { cleanup(); reject(signal.reason) }
          const cleanup = (): void => { remove(); signal.removeEventListener('abort', aborted) }
          signal.addEventListener('abort', aborted, { once: true })
          try { sendBackgroundMessage(message) } catch (error) { cleanup(); reject(error) }
        })
      } else response = await chrome.runtime.sendMessage(message)
      if (!isCommandReply(response) || response.requestId !== requestId) throw new Error('Command result unavailable')
      return response
    }, TIMEOUT_MS, signal)
  } catch {
    return { requestId, ok: false, error: serializeError(new Error('Command result unavailable; the action may already have been applied')) }
  }
}

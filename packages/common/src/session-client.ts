import { MessageTarget, MessageType, type SessionOperation, type SessionSnapshot, type SessionIdentity, type WebToken } from './types'
import { VKApiError, readVKApiError } from './vk-api-error'
import { withTimeout } from './with-timeout'

type SessionHandler = (operation: SessionOperation, signal: AbortSignal) => Promise<SessionSnapshot>
let localHandler: SessionHandler | undefined

export const setLocalSessionHandler = (handler: SessionHandler): void => { localHandler = handler }

export const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value != null && !Array.isArray(value)
export const isIdentity = (value: unknown): value is SessionIdentity => isObject(value) && typeof value.epoch === 'string' && value.epoch.length > 0 && value.epoch.length <= 100 && typeof value.userId === 'string' && value.userId.length <= 100
export const isWebToken = (value: unknown): value is WebToken => {
  if (!isObject(value) || typeof value.userId !== 'string' || value.userId.length > 100 || typeof value.accessToken !== 'string' || value.accessToken.length > 16_384 || typeof value.expires !== 'number' || !Number.isFinite(value.expires) || typeof value.logoutHash !== 'string') return false
  if (value.error === null) return value.userId.length > 0 && value.accessToken.length > 0
  return isObject(value.error) && value.error.type === 'unauthorized' && value.error.serializedError === null && value.userId === '' && value.accessToken === ''
}

export const requestSession = async (operation: SessionOperation, signal?: AbortSignal): Promise<SessionSnapshot> => {
  try {
    return await withTimeout(async requestSignal => {
      if (localHandler != null) return await localHandler(operation, requestSignal)
      const requestId = crypto.randomUUID()
      const cancel = (): void => {
        void chrome.runtime.sendMessage({ target: MessageTarget.SERVICE_WORKER, type: MessageType.SESSION_CANCEL, requestId }).catch(() => {})
      }
      requestSignal.addEventListener('abort', cancel, { once: true })
      try {
        const reply: unknown = await chrome.runtime.sendMessage({ target: MessageTarget.SERVICE_WORKER, type: MessageType.SESSION_REQUEST, requestId, operation })
        requestSignal.throwIfAborted()
        if (!isObject(reply) || reply.requestId !== requestId) throw new VKApiError('format', { operation: 'session', stage: 'transport' })
        if (reply.ok === false) throw readVKApiError(reply.error) ?? new VKApiError('format', { operation: 'session', stage: 'transport' })
        if (reply.ok !== true || !isObject(reply.snapshot) || !isIdentity(reply.snapshot.identity) || !isWebToken(reply.snapshot.token)) throw new VKApiError('format', { operation: 'session', stage: 'transport' })
        if (reply.snapshot.token.error === null && reply.snapshot.token.userId !== reply.snapshot.identity.userId) throw new VKApiError('format', { operation: 'session', stage: 'transport' })
        return { identity: reply.snapshot.identity, token: reply.snapshot.token }
      } catch (error) {
        requestSignal.throwIfAborted()
        if (error instanceof VKApiError) throw error
        throw new VKApiError('unavailable', { operation: 'session', stage: 'transport' })
      } finally {
        requestSignal.removeEventListener('abort', cancel)
      }
    }, 15_000, signal)
  } catch (error) {
    signal?.throwIfAborted()
    if (error instanceof VKApiError) throw error
    throw new VKApiError(error instanceof DOMException && error.name === 'TimeoutError' ? 'timeout' : 'unavailable', { operation: 'session', stage: 'transport' })
  }
}

export const getSessionToken = async (signal?: AbortSignal): Promise<SessionSnapshot> => {
  const { userId, sessionEpoch } = await chrome.storage.local.get(['userId', 'sessionEpoch'])
  signal?.throwIfAborted()
  return await requestSession({ kind: 'token', identity: { userId: typeof userId === 'string' ? userId : '', epoch: typeof sessionEpoch === 'string' && sessionEpoch.length > 0 ? sessionEpoch : 'legacy' } }, signal)
}

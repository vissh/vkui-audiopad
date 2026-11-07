import { commonUtils, sessionClient, vkApiClient, commonTypes } from '@vk-audiopad/common'
import { serializeError } from 'serialize-error'

type Snapshot = commonTypes.SessionSnapshot
type Identity = commonTypes.SessionIdentity
type StoredSnapshot = Snapshot & { deviceId: unknown }
type Flight = { identity: Identity, controller: AbortController, promise: Promise<Snapshot>, users: number }
const sameIdentity = (a: Identity, b: Identity): boolean => a.epoch === b.epoch && a.userId === b.userId

export const createSessionOwner = () => {
  let verification: Flight | undefined
  let refresh: Flight | undefined
  let writing: Promise<unknown> = Promise.resolve()

  const read = async (): Promise<StoredSnapshot> => {
    const stored = await chrome.storage.local.get(['sessionEpoch', 'userId', 'webToken', 'deviceId'])
    const userId = typeof stored.userId === 'string' ? stored.userId : ''
    const epoch = typeof stored.sessionEpoch === 'string' && stored.sessionEpoch.length > 0 ? stored.sessionEpoch : 'legacy'
    const candidate: unknown = sessionClient.isObject(stored.webToken) ? { ...stored.webToken, logoutHash: typeof stored.webToken.logoutHash === 'string' ? stored.webToken.logoutHash : '' } : stored.webToken
    const token = sessionClient.isWebToken(candidate) && candidate.error === null && candidate.userId === userId && candidate.accessToken.length > 0 ? candidate : vkApiClient.UnauthorizedWebToken
    return { identity: { epoch, userId }, token, deviceId: stored.deviceId }
  }
  const assert = async (identity: Identity, signal: AbortSignal): Promise<StoredSnapshot> => {
    signal.throwIfAborted()
    const current = await read()
    signal.throwIfAborted()
    if (!sameIdentity(current.identity, identity)) throw new vkApiClient.VKApiError('session-changed')
    return current
  }
  const write = async (identity: Identity, token: commonTypes.WebToken, verified: boolean, signal: AbortSignal): Promise<Snapshot> => {
    const result = writing.then(async () => {
      const current = await assert(identity, signal)
      const unauthorized = token.error?.type === 'unauthorized'
      const nextUser = unauthorized ? '' : token.userId
      const changed = current.identity.userId !== nextUser
      if (changed && !verified) throw new vkApiClient.VKApiError('session-changed')
      const epoch = changed ? crypto.randomUUID() : current.identity.epoch
      if (unauthorized || changed) {
        await commonUtils.clearStorage(['sessionEpoch'])
        signal.throwIfAborted()
      }
      if (unauthorized) {
        await chrome.storage.local.set({ sessionEpoch: epoch })
      } else {
        if (!sessionClient.isWebToken(token) || token.error != null || token.userId.length === 0 || token.accessToken.length === 0) throw new vkApiClient.VKApiError('format')
        await chrome.storage.local.set({
          sessionEpoch: epoch,
          userId: token.userId,
          webToken: token,
          deviceId: !changed && typeof current.deviceId === 'string' ? current.deviceId : crypto.randomUUID()
        })
      }
      signal.throwIfAborted()
      return { identity: { epoch, userId: nextUser }, token }
    })
    writing = result.catch(() => {})
    return await result
  }
  const start = (identity: Identity, verified: boolean): Flight => {
    const controller = new AbortController()
    const flight: Flight = { identity, controller, users: 0, promise: Promise.resolve({ identity, token: vkApiClient.UnauthorizedWebToken }) }
    flight.promise = commonUtils.withTimeout(async signal => {
      const token = await vkApiClient.fetchAppWebToken(signal)
      await assert(identity, signal)
      if (token.error?.type === 'unauthorized') {
        if (!verified) return { identity, token }
      } else {
        if (token.error != null || token.userId.length === 0 || token.accessToken.length === 0) throw new vkApiClient.VKApiError('format')
        if (!verified && token.userId !== identity.userId) throw new vkApiClient.VKApiError('session-changed')
        if (verified && !await checkProfile(token, signal)) return await write(identity, vkApiClient.UnauthorizedWebToken, true, signal)
      }
      return await write(identity, token, verified, signal)
    }, 15_000, controller.signal).finally(() => {
      if (verification === flight) verification = undefined
      if (refresh === flight) refresh = undefined
    })
    void flight.promise.catch(() => {})
    return flight
  }
  const join = async (flight: Flight, signal: AbortSignal): Promise<Snapshot> => {
    signal.throwIfAborted()
    flight.users++
    let detach = (): void => {}
    try {
      const aborted = new Promise<never>((_resolve, reject) => {
        const stop = (): void => { reject(signal.reason) }
        signal.addEventListener('abort', stop, { once: true })
        detach = () => { signal.removeEventListener('abort', stop) }
      })
      return await Promise.race([flight.promise, aborted])
    } finally {
      detach()
      flight.users--
      if (flight.users === 0) flight.controller.abort()
    }
  }
  return {
    request: async (operation: commonTypes.SessionOperation, callerSignal: AbortSignal): Promise<Snapshot> => await commonUtils.withTimeout(async signal => {
      await writing
      signal.throwIfAborted()
      let current = await read()
      signal.throwIfAborted()
      if (verification != null && !sameIdentity(verification.identity, current.identity)) {
        verification.controller.abort(new vkApiClient.VKApiError('session-changed'))
        verification = undefined
      }
      if (refresh != null && !sameIdentity(refresh.identity, current.identity)) {
        refresh.controller.abort(new vkApiClient.VKApiError('session-changed'))
        refresh = undefined
      }
      if (operation.kind === 'assert') {
        const snapshot = await assert(operation.identity, signal)
        return { identity: snapshot.identity, token: snapshot.token }
      }
      if (operation.kind === 'verify') {
        if (verification?.controller.signal.aborted) verification = undefined
        if (verification == null) {
          refresh?.controller.abort(new vkApiClient.VKApiError('session-changed'))
          refresh = undefined
          verification = start(current.identity, true)
        }
        return await join(verification, signal)
      }
      current = await assert(operation.identity, signal)
      let result: Snapshot
      if (verification != null && !verification.controller.signal.aborted) result = await join(verification, signal)
      else if (current.token.error === null && current.token.expires > Date.now() / 1000 + 10 && (operation.kind === 'token' || current.token.accessToken !== operation.rejectedToken)) result = current
      else {
        if (refresh?.controller.signal.aborted) refresh = undefined
        refresh ??= start(current.identity, false)
        result = await join(refresh, signal)
      }
      if (!sameIdentity(current.identity, result.identity)) throw new vkApiClient.VKApiError('session-changed')
      await assert(result.identity, signal)
      return { identity: result.identity, token: result.token }
    }, 15_000, callerSignal)
  }
}

const checkProfile = async (token: commonTypes.WebToken, signal: AbortSignal): Promise<boolean> => {
  const params = new URLSearchParams({ app_id: vkApiClient.VK_APP_ID, v: vkApiClient.API_VERSION, access_token: token.accessToken })
  const response = await fetch(`https://api.vk.ru/method/account.getProfileNavigationInfo?v=${vkApiClient.QUERY_API_VERSION}&client_id=${vkApiClient.VK_APP_ID}`, { method: 'POST', body: params, signal })
  signal.throwIfAborted()
  if (response.status === 401) return false
  if (!response.ok) throw new vkApiClient.VKApiError('unavailable')
  const payload: unknown = await response.json()
  signal.throwIfAborted()
  if (!sessionClient.isObject(payload)) throw new vkApiClient.VKApiError('format')
  if ('error' in payload) {
    if (sessionClient.isObject(payload.error) && payload.error.error_code === 5) return false
    throw new vkApiClient.VKApiError('unavailable')
  }
  if (!sessionClient.isObject(payload.response)) throw new vkApiClient.VKApiError('format')
  return true
}

const validOperation = (operation: unknown): operation is commonTypes.SessionOperation => {
  if (!sessionClient.isObject(operation)) return false
  if (operation.kind === 'verify') return true
  if (operation.kind === 'token') return sessionClient.isIdentity(operation.identity)
  if (operation.kind === 'assert') return sessionClient.isIdentity(operation.identity)
  if (operation.kind === 'refresh') return sessionClient.isIdentity(operation.identity) && typeof operation.rejectedToken === 'string' && operation.rejectedToken.length <= 16_384
  return false
}

export const startSessionService = (): void => {
  const owner = createSessionOwner()
  sessionClient.setLocalSessionHandler(owner.request)
  const pending = new Map<string, { controller: AbortController, sender: string }>()
  chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse): boolean | undefined => {
    if (!sessionClient.isObject(message) || message.target !== commonTypes.MessageTarget.SERVICE_WORKER || (message.type !== commonTypes.MessageType.SESSION_REQUEST && message.type !== commonTypes.MessageType.SESSION_CANCEL)) return undefined
    const requestId = typeof message.requestId === 'string' && message.requestId.length > 0 && message.requestId.length <= 100 ? message.requestId : ''
    const respond = (reply: commonTypes.SessionReply): void => { try { sendResponse(reply) } catch {} }
    const fail = (kind: 'format' | 'unavailable'): void => { respond({ requestId, ok: false, error: serializeError(new vkApiClient.VKApiError(kind)) }) }
    const trusted = sender.id === chrome.runtime.id && typeof sender.url === 'string' && sender.url.startsWith(chrome.runtime.getURL(''))
    if (!trusted || requestId === '') { fail('format'); return undefined }
    const senderKey = JSON.stringify([sender.documentId, sender.url, sender.frameId, sender.tab?.id])
    if (message.type === commonTypes.MessageType.SESSION_CANCEL) {
      const active = pending.get(requestId)
      if (active?.sender === senderKey) active.controller.abort()
      return undefined
    }
    if (!validOperation(message.operation) || pending.has(requestId)) { fail('format'); return undefined }
    const controller = new AbortController()
    pending.set(requestId, { controller, sender: senderKey })
    void owner.request(message.operation, controller.signal).then(snapshot => {
      respond({ requestId, ok: true, snapshot })
    }, error => {
      const safe = error instanceof vkApiClient.VKApiError ? error : error instanceof DOMException && error.name === 'TimeoutError' ? new vkApiClient.VKApiError('timeout') : new vkApiClient.VKApiError('unavailable')
      respond({ requestId, ok: false, error: serializeError(safe) })
    }).finally(() => { pending.delete(requestId) })
    return true
  })
}

import { castToArray } from './cast'
import { type JSONValue, type VKApiResponse } from './types'
import { VKApiError, requestOperation, responseDetails, type VKApiErrorDetails } from './vk-api-error'
import { withTimeout } from './with-timeout'

export const request = async (url: string, params: Record<string, string>, signal?: AbortSignal, { retryAfterReconnect = true } = {}): Promise<VKApiResponse> => {
  signal?.throwIfAborted()
  let details: VKApiErrorDetails = { operation: requestOperation(url), stage: 'request', attempt: 1 }
  const formData = new FormData()
  Object.keys(params).forEach(key => { formData.set(key, params[key]) })

  const fetchResponse = async (target: string, options: RequestInit, requestSignal: AbortSignal): Promise<Response> => {
    let resp: Response
    try { resp = await fetch(target, options) } catch {
      requestSignal.throwIfAborted()
      throw new VKApiError('network', details)
    }
    requestSignal.throwIfAborted()
    details = { ...details, ...responseDetails(resp) }
    // Legacy HTTP failures do not establish logout, even at the token endpoint.
    if (!resp.ok) throw new VKApiError(resp.status === 429 ? 'rate-limit' : 'http', details)
    return resp
  }
  const fetchPayload = async (requestSignal: AbortSignal): Promise<[JSONValue, boolean]> => {
    const resp = await fetchResponse(url, {
      method: 'POST',
      signal: requestSignal,
      body: formData,
      headers: { 'x-requested-with': 'XMLHttpRequest' }
    }, requestSignal)
    let content: string
    try { content = await win1251ResponseToUTF8String(resp) } catch {
      requestSignal.throwIfAborted()
      throw new VKApiError('network', details)
    }
    requestSignal.throwIfAborted()

    try {
      return [JSON.parse(content), false]
    } catch (err) {
      return [null, true]
    }
  }

  try {
    return await withTimeout(async requestSignal => {
      const [resp, parseError] = await fetchPayload(requestSignal)
      if (!parseError && !needRetry(resp)) return resp
      if (!retryAfterReconnect) throw new VKApiError(parseError ? 'format' : 'unavailable', details)
      details = { operation: details.operation, stage: 'reconnect', attempt: 1 }
      await fetchResponse('https://vk.ru', { signal: requestSignal }, requestSignal)
      details = { operation: details.operation, stage: 'retry', attempt: 2 }
      const [retried, retryParseError] = await fetchPayload(requestSignal)
      if (retryParseError || needRetry(retried)) throw new VKApiError(retryParseError ? 'format' : 'unavailable', details)
      return retried
    }, 15_000, signal)
  } catch (error) {
    signal?.throwIfAborted()
    if (error instanceof VKApiError) throw error
    throw new VKApiError(error instanceof DOMException && error.name === 'TimeoutError' ? 'timeout' : 'unavailable', details)
  }
}

export const assertMutationResponse = (resp: VKApiResponse): void => {
  if (typeof resp !== 'object' || resp == null || Array.isArray(resp) || !Array.isArray(resp.payload)) throw new Error('Invalid VK mutation response')
  if (resp.payload[0] !== 0 && resp.payload[0] !== '0') throw new Error('VK mutation failed')
  if (!Array.isArray(resp.payload[1])) throw new Error('Invalid VK mutation response')
}

export const parseResponsePayload = (resp: VKApiResponse, indexes: [number, ...number[]]): JSONValue => {
  if (typeof resp !== 'object' || resp == null) {
    throw new Error(`parseResponsePayload: Unexpected response type ${typeof resp}`)
  }

  if (Array.isArray(resp)) {
    throw new Error('parseResponsePayload: Unexpected response type Array')
  }

  const payload = castToArray(resp.payload)

  let value = payload
  for (const [i, payloadIndex] of indexes.entries()) {
    const result = value[payloadIndex]

    if (i === indexes.length - 1) {
      return result
    }

    value = castToArray(result)
  }

  throw new Error('parseResponsePayload: empty indexes')
}

const needRetry = (raw: JSONValue): boolean => {
  if (typeof raw !== 'object' || raw == null) {
    return false
  }

  if (!('payload' in raw)) {
    return false
  }

  if (!Array.isArray(raw.payload)) {
    return false
  }

  return raw.payload.length === 2 && raw.payload[0] === '3'
}

const win1251ResponseToUTF8String = async (response: Response): Promise<string> => {
  const contentType = response.headers.get('Content-Type')

  if ((contentType != null) && contentType.toLowerCase().includes('charset=windows-1251')) {
    return new TextDecoder('windows-1251').decode(await response.arrayBuffer())
  }

  return await response.text()
}

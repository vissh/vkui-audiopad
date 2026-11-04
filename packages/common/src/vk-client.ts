import { castToArray } from './cast'
import { type JSONValue, type VKApiResponse } from './types'

export const request = async (url: string, params: Record<string, string>, signal?: AbortSignal, { requireOk = false, retryAfterReconnect = true } = {}): Promise<VKApiResponse> => {
  signal?.throwIfAborted()
  const formData = new FormData()
  Object.keys(params).forEach(key => { formData.set(key, params[key]) })

  const fetchPayload = async (): Promise<[JSONValue, boolean]> => {
    const resp = await fetch(url, {
      method: 'POST',
      signal,
      body: formData,
      headers: { 'x-requested-with': 'XMLHttpRequest' }
    })

    if (requireOk && !resp.ok) throw new Error('VK HTTP request failed')

    const content = await win1251ResponseToUTF8String(resp)

    try {
      return [JSON.parse(content), false]
    } catch (err) {
      return [null, true]
    }
  }

  const [resp, parseError] = await fetchPayload()
  signal?.throwIfAborted()

  if (parseError || needRetry(resp)) {
    if (!retryAfterReconnect) throw new Error('VK request failed')
    await fetch('https://vk.ru', { signal })
    signal?.throwIfAborted()
    const [respAfterReconnect, retryParseError] = await fetchPayload()
    signal?.throwIfAborted()
    if (retryParseError) {
      throw new Error('respAfterReconnect')
    }
    return respAfterReconnect
  }

  return resp
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

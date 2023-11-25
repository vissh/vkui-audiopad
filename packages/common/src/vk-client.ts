import { castToArray } from './cast'
import { type JSONValue, type VKApiResponse } from './types'

export const request = async (url: string, params: Record<string, string>): Promise<VKApiResponse> => {
  const formData = new FormData()
  Object.keys(params).forEach(key => { formData.set(key, params[key]) })

  const fetchPayload = async (): Promise<JSONValue> => {
    const resp = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: { 'x-requested-with': 'XMLHttpRequest' }
    })

    return JSON.parse(await win1251ResponseToUTF8String(resp))
  }

  let resp = await fetchPayload()

  if (needRetry(resp)) {
    await fetch('https://vk.com')
    resp = await fetchPayload()
  }

  return resp
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

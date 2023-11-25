import { type JSONObject, type JSONValue } from './types'

export const castToArray = (raw: JSONValue): JSONValue[] => {
  if (!Array.isArray(raw)) {
    throw new Error(`castToArray: Unexpected type ${typeof raw} to casting. Value: ${JSON.stringify(raw)}`)
  }
  return raw
}

export const castToObject = (raw: JSONValue): object => {
  if (typeof raw !== 'object') {
    throw new Error(`castToObject: Unexpected type ${typeof raw} to casting. Value: ${JSON.stringify(raw)}`)
  }

  if (raw == null) {
    throw new Error('castToObject: Unexpected value, value is null')
  }

  return raw
}

export const castToJSONObject = (raw: JSONValue): JSONObject => {
  const obj = castToObject(raw)

  if (Array.isArray(obj)) {
    throw new Error('castToJSONObject: Unexpected array to casting')
  }

  if (obj == null) {
    throw new Error('castToJSONObject: Unexpected null value')
  }

  return obj as JSONObject
}

export const castToString = (raw: JSONValue): string => {
  if (typeof raw !== 'string') {
    throw new Error(`castToString: Unexpected type ${typeof raw} to casting. Value: ${JSON.stringify(raw)}`)
  }
  return raw
}

export const castToNumber = (raw: JSONValue): number => {
  if (typeof raw !== 'number') {
    throw new Error(`castToNumber: Unexpected type ${typeof raw} to casting. Value: ${JSON.stringify(raw)}`)
  }
  return raw
}

export const safeCastToString = (raw: JSONValue): string => {
  if (typeof raw !== 'string') {
    if (typeof raw === 'number') {
      return raw === 0 ? '' : raw.toString()
    }
    if (typeof raw === 'boolean' && !raw) {
      return ''
    }
    if (Array.isArray(raw) && raw.length === 0) {
      return ''
    }
    if (raw == null) {
      return ''
    }

    throw new Error(`safeCastToString: Unexpected type ${typeof raw} to casting. Value: ${JSON.stringify(raw)}`)
  }

  return raw
}

export const safeCastToNumber = (raw: JSONValue): number => {
  if (typeof raw !== 'number') {
    if (raw == null) {
      return 0
    }
    if (typeof raw === 'string' && raw === '') {
      return 0
    }
    if (typeof raw === 'boolean' && !raw) {
      return 0
    }
    throw new Error(`safeCastToNumber: Unexpected type ${typeof raw} to casting. Value: ${JSON.stringify(raw)}`)
  }
  return raw
}

export const safeCastToArray = (raw: JSONValue): JSONValue[] => {
  if (!Array.isArray(raw)) {
    if (typeof raw === 'string' && raw === '') {
      return []
    }
    if (typeof raw === 'number' && raw === 0) {
      return []
    }
    if (typeof raw === 'boolean' && !raw) {
      return []
    }
    if (raw == null) {
      return []
    }
    throw new Error(`safeCastToArray: Unexpected type ${typeof raw} to casting. Value: ${JSON.stringify(raw)}`)
  }

  return raw
}

export const safeCastToBoolean = (raw: JSONValue): boolean => {
  if (raw == null) {
    return false
  }

  if (typeof raw === 'number') {
    if (raw === 0) {
      return false
    }

    if (raw === 1) {
      return true
    }

    throw new Error(`safeCastToBoolean: unexpected number ${raw}`)
  }

  if (typeof raw === 'string') {
    if (raw.length === 0) {
      return false
    }

    throw new Error(`safeCastToBoolean: unexpected string ${raw}`)
  }

  if (typeof raw !== 'boolean') {
    throw new Error(`safeCastToBoolean: unexpected type ${typeof raw} to casting. Value: ${JSON.stringify(raw)}`)
  }

  return raw
}

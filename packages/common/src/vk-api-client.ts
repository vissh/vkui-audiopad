import { castToJSONObject, castToNumber, castToString, safeCastToString } from './cast'
import { toTrackItemFromAPIResponse } from './converter'
import { type JSONObject, type TrackItem, type WebToken } from './types'
import { request as vkClientRequest } from './vk-client'

export const VK_APP_ID = '6287487'
export const QUERY_API_VERSION = '5.246'
export const API_VERSION = '5.163'

export const UnauthorizedWebToken: WebToken = {
  userId: '',
  accessToken: '',
  expires: 0,
  logoutHash: '',
  error: {
    type: 'unauthorized',
    serializedError: null
  }
}

export const getStreamMixAudios = async (): Promise<TrackItem> => {
  const resp = await request(
    `https://api.vk.com/method/audio.getStreamMixAudios?v=${QUERY_API_VERSION}&client_id=${VK_APP_ID}`,
    'POST',
    {
      mix_id: 'common',
      count: '1'
    }
  )

  return toTrackItemFromAPIResponse(resp)
}

export const request = async (url: string, method: 'GET' | 'POST', params: Record<string, string>): Promise<JSONObject> => {
  const formData = new URLSearchParams(params)

  const accessToken = (await getOrUpdateAccessToken()).accessToken
  formData.set('access_token', accessToken)

  const _request = async (url: string, method: 'GET' | 'POST', formData: URLSearchParams): Promise<JSONObject> => {
    const resp = await fetch(url, { method, body: formData })
    return castToJSONObject(await resp.json())
  }

  const data = await _request(url, method, formData)
  if (data.error != null) {
    const error = castToJSONObject(data.error)
    if (error.error_code === 5) {
      const webToken = await updateWebToken()
      formData.set('access_token', webToken.accessToken)
      return await _request(url, method, formData)
    }
  }
  return data
}

export const getOrUpdateAccessToken = async (): Promise<WebToken> => {
  const webToken = await getWebTokenFromStorage()

  if (webToken != null && (webToken.expires > Math.round((+new Date()) / 1000) + 10)) {
    return webToken
  }

  return await updateWebToken()
}

export const updateWebToken = async (): Promise<WebToken> => {
  const newWebToken = await fetchAppWebToken()
  await setWebTokenToStorage(newWebToken)
  return newWebToken
}

export const fetchAppWebToken = async (): Promise<WebToken> => {
  const resp = await vkClientRequest('https://login.vk.com/?act=web_token', {
    version: '1',
    app_id: VK_APP_ID,
    access_token: ''
  })

  const jsonResp = castToJSONObject(resp)

  if (jsonResp.type === 'error' && jsonResp.error_info === 'unauthorized') {
    return UnauthorizedWebToken
  } else if (jsonResp.type !== 'okay') {
    throw new Error('web_token was not received. response: ' + JSON.stringify(jsonResp))
  }

  const data = castToJSONObject(jsonResp.data)

  return {
    userId: safeCastToString(data.user_id),
    accessToken: castToString(data.access_token),
    expires: castToNumber(data.expires),
    logoutHash: castToString(data.logout_hash),
    error: null
  }
}

const getWebTokenFromStorage = async (): Promise<WebToken | undefined> => {
  return await new Promise((resolve) => {
    chrome.storage.local.get(('webToken'), (result) => {
      resolve(result.webToken)
    })
  })
}

const setWebTokenToStorage = async (webToken: WebToken): Promise<void> => {
  await new Promise((resolve) => {
    chrome.storage.local.set({ webToken }, () => {
      resolve(null)
    })
  })
}

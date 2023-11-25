import { cast, vkClient, type commonTypes } from '@vk-audiopad/common'
import { type JSONValue } from '@vk-audiopad/common/dist/types'
import { serializeError } from 'serialize-error'

const VK_APP_ID = '6287487'
const QUERY_API_VERSION = '5.223'
const API_VERSION = '5.163'

const UnauthorizedWebToken: commonTypes.WebToken = {
  userId: '',
  accessToken: '',
  expires: 0,
  logoutHash: '',
  error: {
    type: 'unauthorized',
    serializedError: null
  }
}

export const fetchWebToken = async (): Promise<commonTypes.WebToken> => {
  try {
    let webToken = await _fetchAppWebToken()

    if (!(await _getProfileNavigationInfo(webToken))) {
      webToken = UnauthorizedWebToken
    }

    return webToken
  } catch (err) {
    return {
      userId: '',
      accessToken: '',
      expires: 0,
      logoutHash: '',
      error: {
        type: 'exception',
        serializedError: serializeError(err)
      }
    }
  }
}

const _fetchAppWebToken = async (): Promise<commonTypes.WebToken> => {
  const resp = await vkClient.request('https://login.vk.com/?act=web_token', {
    version: '1',
    app_id: VK_APP_ID,
    access_token: ''
  })

  const jsonResp = cast.castToJSONObject(resp)

  if (jsonResp.type === 'error' && jsonResp.error_info === 'unauthorized') {
    return UnauthorizedWebToken
  } else if (jsonResp.type !== 'okay') {
    throw new Error('web_token was not received. response: ' + JSON.stringify(jsonResp))
  }

  const data = cast.castToJSONObject(jsonResp.data)

  return {
    userId: cast.safeCastToString(data.user_id),
    accessToken: cast.castToString(data.access_token),
    expires: cast.castToNumber(data.expires),
    logoutHash: cast.castToString(data.logout_hash),
    error: null
  }
}

const _getProfileNavigationInfo = async (webToken: commonTypes.WebToken): Promise<boolean> => {
  const params = new URLSearchParams()
  params.set('app_id', VK_APP_ID)
  params.set('v', API_VERSION)
  params.set('access_token', webToken.accessToken)

  const resp = await fetch(`https://api.vk.com/method/account.getProfileNavigationInfo?v=${QUERY_API_VERSION}&client_id=${VK_APP_ID}`, {
    method: 'POST',
    body: params
  })

  const jsonResp = cast.castToJSONObject((await resp.json()) as JSONValue)
  return 'response' in jsonResp
}

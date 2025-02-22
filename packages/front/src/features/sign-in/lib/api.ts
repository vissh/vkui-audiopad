import { cast, vkApiClient, type commonTypes } from '@vk-audiopad/common'
import { type JSONValue } from '@vk-audiopad/common/dist/types'
import { serializeError } from 'serialize-error'

export const fetchWebToken = async (): Promise<commonTypes.WebToken> => {
  try {
    let webToken = await vkApiClient.fetchAppWebToken()

    if (!(await _getProfileNavigationInfo(webToken))) {
      webToken = vkApiClient.UnauthorizedWebToken
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

const _getProfileNavigationInfo = async (webToken: commonTypes.WebToken): Promise<boolean> => {
  const params = new URLSearchParams()
  params.set('app_id', vkApiClient.VK_APP_ID)
  params.set('v', vkApiClient.API_VERSION)
  params.set('access_token', webToken.accessToken)

  const resp = await fetch(`https://api.vk.com/method/account.getProfileNavigationInfo?v=${vkApiClient.QUERY_API_VERSION}&client_id=${vkApiClient.VK_APP_ID}`, {
    method: 'POST',
    body: params
  })

  const jsonResp = cast.castToJSONObject((await resp.json()) as JSONValue)
  return 'response' in jsonResp
}

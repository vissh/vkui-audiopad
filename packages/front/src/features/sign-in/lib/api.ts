import { commonUtils, vkApiClient, type commonTypes } from '@vk-audiopad/common'

const SESSION_CHECK_TIMEOUT_MS = 15_000

export const fetchWebToken = async (signal?: AbortSignal): Promise<commonTypes.WebToken> => {
  try {
    return await commonUtils.withTimeout(verifyToken, SESSION_CHECK_TIMEOUT_MS, signal)
  } catch {
    signal?.throwIfAborted()
    return {
      userId: '',
      accessToken: '',
      expires: 0,
      logoutHash: '',
      error: {
        type: 'exception',
        serializedError: { name: 'Error', message: 'VK session check failed' }
      }
    }
  }
}

const verifyToken = async (signal: AbortSignal): Promise<commonTypes.WebToken> => {
  signal.throwIfAborted()
  const webToken = await vkApiClient.fetchAppWebToken(signal)
  signal.throwIfAborted()
  if (webToken.error?.type === 'unauthorized') return vkApiClient.UnauthorizedWebToken
  if (webToken.error != null || webToken.accessToken.length === 0 || webToken.userId.length === 0) throw new Error('Invalid VK token response')
  const authorized = await checkProfile(webToken, signal)
  signal.throwIfAborted()
  return authorized ? webToken : vkApiClient.UnauthorizedWebToken
}

const checkProfile = async (webToken: commonTypes.WebToken, signal?: AbortSignal): Promise<boolean> => {
  const params = new URLSearchParams()
  params.set('app_id', vkApiClient.VK_APP_ID)
  params.set('v', vkApiClient.API_VERSION)
  params.set('access_token', webToken.accessToken)
  const response = await fetch(`https://api.vk.ru/method/account.getProfileNavigationInfo?v=${vkApiClient.QUERY_API_VERSION}&client_id=${vkApiClient.VK_APP_ID}`, {
    method: 'POST',
    body: params,
    signal
  })
  signal?.throwIfAborted()
  if (response.status === 401) return false
  if (!response.ok) throw new Error('VK profile check failed')
  const payload: unknown = await response.json()
  signal?.throwIfAborted()
  if (typeof payload !== 'object' || payload == null || Array.isArray(payload)) throw new Error('Invalid VK profile response')
  if ('error' in payload) {
    const error = payload.error
    if (typeof error === 'object' && error != null && 'error_code' in error && error.error_code === 5) return false
    throw new Error('VK profile check failed')
  }
  if (!('response' in payload) || typeof payload.response !== 'object' || payload.response == null || Array.isArray(payload.response)) throw new Error('Invalid VK profile response')
  return true
}

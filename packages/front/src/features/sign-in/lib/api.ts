import { sessionClient, type commonTypes } from '@vk-audiopad/common'

export const fetchWebToken = async (signal?: AbortSignal): Promise<commonTypes.WebToken> => {
  try {
    return (await sessionClient.requestSession({ kind: 'verify' }, signal)).token
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

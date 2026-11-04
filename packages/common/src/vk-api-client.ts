import { castToJSONObject, castToNumber, castToString, safeCastToString } from './cast'
import { toTrackItemFromAPIResponse } from './converter'
import { type JSONObject, type TrackItem, type WebToken } from './types'
import { request as vkClientRequest } from './vk-client'
import { VKApiError } from './vk-api-error'
import { withTimeout } from './with-timeout'

export { VKApiError } from './vk-api-error'

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

export const getStreamMixAudios = async (signal?: AbortSignal): Promise<TrackItem> => {
  const resp = await request(
    `https://api.vk.ru/method/audio.getStreamMixAudios?v=${QUERY_API_VERSION}&client_id=${VK_APP_ID}`,
    'POST',
    {
      mix_id: 'common',
      count: '1'
    },
    signal
  )

  return toTrackItemFromAPIResponse(resp)
}

// vk.ru artist pages moved to the token-based catalog API: the page HTML
// no longer embeds a sectionId, so we resolve it via catalog.getAudioArtist
// and feed the old al_audio.php?act=load_catalog_section endpoint with it.
// The optional page url selects an artist subpage section (releases,
// featuring_releases, top_audios, ...).
export const getArtistCatalogSectionId = async (artistId: string, pageUrl?: string): Promise<string | null> => {
  const params: Record<string, string> = {
    artist_id: artistId,
    need_blocks: '1',
    ref: ''
  }
  if (pageUrl != null) {
    params.url = pageUrl
  }

  const resp = await request(
    `https://api.vk.ru/method/catalog.getAudioArtist?v=${QUERY_API_VERSION}&client_id=${VK_APP_ID}`,
    'POST',
    params
  )

  return firstSectionId(resp)
}

// "Show all" links of general/explore/my-music blocks point to
// /audios<ownerId>?section=<name>&block=<block> pages; their section id
// is resolved via catalog.getAudio with the page url.
export const getAudioCatalogSectionId = async (pageUrl: string): Promise<string | null> => {
  const resp = await request(
    `https://api.vk.ru/method/catalog.getAudio?v=${QUERY_API_VERSION}&client_id=${VK_APP_ID}`,
    'POST',
    {
      url: pageUrl,
      need_blocks: '1'
    }
  )

  return firstSectionId(resp)
}

// A successful catalog may lack the expected section shape.
// Transport/VK errors reject in request; missing sections return null here.
const firstSectionId = (resp: JSONObject): string | null => {
  if (isJSONObjectValue(resp.response)) {
    const catalog = resp.response.catalog
    if (isJSONObjectValue(catalog)) {
      const sections = catalog.sections
      if (Array.isArray(sections) && isJSONObjectValue(sections[0])) {
        const sectionId = safeCastToString(sections[0].id)
        if (sectionId.length > 0) {
          return sectionId
        }
      }
    }
  }

  return null
}

const isJSONObjectValue = (value: unknown): value is JSONObject => {
  return typeof value === 'object' && value != null && !Array.isArray(value)
}

export const request = async (url: string, method: 'GET' | 'POST', params: Record<string, string>, signal?: AbortSignal): Promise<JSONObject> => {
  try {
    return await withTimeout(async requestSignal => {
      let token = await getOrUpdateAccessToken(requestSignal)
      for (let attempt = 0; attempt < 2; attempt++) {
        requestSignal.throwIfAborted()
        if (token.error?.type === 'unauthorized') throw new VKApiError('unauthorized')
        if (token.error != null) throw new VKApiError('unavailable')
        if (token.accessToken.length === 0 || token.userId.length === 0) throw new VKApiError('format')
        const body = new URLSearchParams(params)
        body.set('access_token', token.accessToken)
        const target = new URL(url)
        const options: RequestInit = { method, signal: requestSignal }
        if (method === 'GET') body.forEach((value, key) => { target.searchParams.set(key, value) })
        else options.body = body
        try {
          return await performRequest(target.toString(), options, requestSignal)
        } catch (error) {
          requestSignal.throwIfAborted()
          if (!(error instanceof VKApiError) || error.kind !== 'unauthorized' || attempt !== 0) throw error
          token = await updateWebToken(requestSignal)
        }
      }
      throw new VKApiError('unauthorized')
    }, 15_000, signal)
  } catch (error) {
    signal?.throwIfAborted()
    if (error instanceof VKApiError) throw error
    if (error instanceof DOMException && error.name === 'TimeoutError') throw new VKApiError('timeout')
    throw new VKApiError('unavailable')
  }
}

const performRequest = async (url: string, options: RequestInit, signal: AbortSignal): Promise<JSONObject> => {
  let response: Response
  try {
    response = await fetch(url, options)
  } catch {
    signal.throwIfAborted()
    throw new VKApiError('network')
  }
  signal.throwIfAborted()
  if (!response.ok) throw new VKApiError(response.status === 401 ? 'unauthorized' : response.status === 429 ? 'rate-limit' : 'http', { status: response.status })
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    signal.throwIfAborted()
    throw new VKApiError('format')
  }
  signal.throwIfAborted()
  if (!isJSONObjectValue(payload)) throw new VKApiError('format')
  if (payload.error != null) {
    if (!isJSONObjectValue(payload.error) || typeof payload.error.error_code !== 'number') throw new VKApiError('format')
    const code = payload.error.error_code
    throw new VKApiError(code === 5 ? 'unauthorized' : code === 6 || code === 9 ? 'rate-limit' : 'vk', { code, status: response.status })
  }
  if (!('response' in payload)) throw new VKApiError('format')
  return payload
}

export const getOrUpdateAccessToken = async (signal?: AbortSignal): Promise<WebToken> => {
  const webToken = await getWebTokenFromStorage()
  signal?.throwIfAborted()

  if (webToken != null && (webToken.expires > Math.round((+new Date()) / 1000) + 10)) {
    return webToken
  }

  return await updateWebToken(signal)
}

export const updateWebToken = async (signal?: AbortSignal): Promise<WebToken> => {
  const newWebToken = await fetchAppWebToken(signal)
  signal?.throwIfAborted()
  if (newWebToken.error == null) await setWebTokenToStorage(newWebToken)
  return newWebToken
}

export const fetchAppWebToken = async (signal?: AbortSignal): Promise<WebToken> => {
  const resp = await vkClientRequest('https://login.vk.ru/?act=web_token', {
    version: '1',
    app_id: VK_APP_ID,
    access_token: ''
  }, signal, { requireOk: true })

  try {
    const jsonResp = castToJSONObject(resp)

    if (jsonResp.type === 'error' && jsonResp.error_info === 'unauthorized') {
      return UnauthorizedWebToken
    } else if (jsonResp.type !== 'okay') {
      throw new Error('VK web token was not received')
    }

    const data = castToJSONObject(jsonResp.data)

    return {
      userId: safeCastToString(data.user_id),
      accessToken: castToString(data.access_token),
      expires: castToNumber(data.expires),
      logoutHash: castToString(data.logout_hash),
      error: null
    }
  } catch {
    throw new Error('Invalid VK web token response')
  }
}

const getWebTokenFromStorage = async (): Promise<WebToken | undefined> => {
  const { webToken: stored } = await chrome.storage.local.get('webToken')
  const value: unknown = stored
  if (typeof value !== 'object' || value == null) return undefined
  if (!('accessToken' in value) || typeof value.accessToken !== 'string' || value.accessToken.length === 0) return undefined
  if (!('userId' in value) || typeof value.userId !== 'string' || value.userId.length === 0) return undefined
  if (!('expires' in value) || typeof value.expires !== 'number' || !Number.isFinite(value.expires)) return undefined
  if (!('error' in value) || value.error !== null) return undefined
  return { accessToken: value.accessToken, userId: value.userId, expires: value.expires, logoutHash: 'logoutHash' in value && typeof value.logoutHash === 'string' ? value.logoutHash : '', error: null }
}

const setWebTokenToStorage = async (webToken: WebToken): Promise<void> => {
  await chrome.storage.local.set({ webToken })
}

export const setBroadcast = async (ownerId?: string, audioId?: string): Promise<JSONObject> => {
  const params: Record<string, string> = {}
  if (ownerId != null && audioId != null) {
    params.audio = `${ownerId}_${audioId}`
  }

  return await request(
    `https://api.vk.ru/method/audio.setBroadcast?v=${QUERY_API_VERSION}`,
    'POST',
    params
  )
}

import { castToJSONObject, castToNumber, castToString, safeCastToString } from './cast'
import { toTrackItemFromAPIResponse } from './converter'
import { type JSONObject, type TrackItem, type WebToken } from './types'
import { request as vkClientRequest } from './vk-client'
import { VKApiError, requestOperation, responseDetails, withVKApiErrorDetails, type VKApiErrorDetails } from './vk-api-error'
import { withTimeout } from './with-timeout'
import { getSessionToken, requestSession } from './session-client'
import { type SessionIdentity } from './types'
import { parseSettings, type MixSettings } from './vk-mix'

export { VKApiError } from './vk-api-error'

export const VK_APP_ID = '6287487'
export const QUERY_API_VERSION = '5.246'
export const API_VERSION = '5.163'

export const getAudioLyrics = async (track: Pick<TrackItem, 'id' | 'accessKey'>, signal?: AbortSignal): Promise<string | null> => {
  if (!/^-?[1-9]\d*_[1-9]\d*$/.test(track.id)) throw new VKApiError('format')
  let result: JSONObject
  try {
    result = await request(
      `https://api.vk.ru/method/audio.getLyrics?v=${QUERY_API_VERSION}&client_id=${VK_APP_ID}`,
      'POST',
      { audio_id: track.id + (track.accessKey.length > 0 ? `_${track.accessKey}` : '') },
      signal
    )
  } catch (error) {
    if (error instanceof VKApiError && error.kind === 'vk' && error.code === 104) return null
    throw error
  }
  const response = result.response
  if (!isJSONObjectValue(response) || !isJSONObjectValue(response.lyrics)) throw new VKApiError('format')
  let lines = response.lyrics.text
  if (lines === undefined && Array.isArray(response.lyrics.timestamps)) {
    lines = response.lyrics.timestamps.map(row => {
      if (!isJSONObjectValue(row)) throw new VKApiError('format')
      if (row.line === undefined && row.interlude === true) return ''
      return row.line
    })
  }
  if (!Array.isArray(lines) || !lines.every(line => typeof line === 'string')) throw new VKApiError('format')
  const text = lines.join('\n').replace(/\r\n?/g, '\n').trim()
  return text.length > 0 ? text : null
}

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

export const setRadioStationFollowed = async (userId: string, stationId: string, followed: boolean): Promise<void> => {
  if (!/^[1-9]\d*$/.test(userId) || !/^[1-9]\d*$/.test(stationId)) throw new VKApiError('format')
  const { response } = await request(`https://api.vk.ru/method/audio.${followed ? 'followRadioStation' : 'unfollowRadioStation'}?v=${QUERY_API_VERSION}&client_id=${VK_APP_ID}`, 'POST', { station_id: stationId }, undefined, userId)
  if (response !== 1) throw new VKApiError('format')
}

export const getStreamMixAudios = async (signal?: AbortSignal, mixId = 'common', mixOptions = '', entityId = ''): Promise<TrackItem> => {
  const resp = await request(
    `https://api.vk.ru/method/audio.getStreamMixAudios?v=${QUERY_API_VERSION}&client_id=${VK_APP_ID}`,
    'POST',
    {
      mix_id: mixId,
      count: '1',
      ...(entityId.length > 0 ? { entity_id: entityId } : {}),
      ...(mixOptions.length > 0 ? { options: mixOptions } : {})
    },
    signal
  )

  return toTrackItemFromAPIResponse(resp)
}

export const getStreamMixSettings = async (userId: string, signal?: AbortSignal): Promise<MixSettings> => {
  return parseSettings(await request(`https://api.vk.ru/method/audio.getStreamMixSettings?v=${QUERY_API_VERSION}&client_id=${VK_APP_ID}`, 'POST', { mix_id: 'common' }, signal, userId))
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

export const getArtistCatalog = async (artistId: string, signal?: AbortSignal): Promise<JSONObject> => {
  if (!/^[\w-]+$/.test(artistId)) throw new VKApiError('format')
  return await request(`https://api.vk.ru/method/catalog.getAudioArtist?v=${QUERY_API_VERSION}&client_id=${VK_APP_ID}`, 'POST', { artist_id: artistId, need_blocks: '1', extended: '1', fields: 'photo_50,photo_100', ref: '' }, signal)
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

export const getAudioCatalog = async (ownerId: string, signal?: AbortSignal, section: 'general' | 'all' | 'explore' | 'radiostations' = 'general'): Promise<JSONObject> => {
  if (!/^[1-9]\d*$/.test(ownerId)) throw new VKApiError('format')
  return await request(`https://api.vk.ru/method/catalog.getAudio?v=${QUERY_API_VERSION}&client_id=${VK_APP_ID}`, 'POST', {
    owner_id: ownerId, url: `https://vk.ru/audios${ownerId}?section=${section}`, need_blocks: '1', extended: '1', fields: 'photo_50,photo_100'
  }, signal, ownerId)
}

export const getCuratorCatalog = async (curatorId: string, signal?: AbortSignal): Promise<JSONObject> => {
  if (!/^[\w-]+$/.test(curatorId)) throw new VKApiError('format')
  return await request(`https://api.vk.ru/method/catalog.getAudioCurator?v=${QUERY_API_VERSION}&client_id=${VK_APP_ID}`, 'POST', { curator_id: curatorId, url: `https://vk.ru/music/curator/${curatorId}`, need_blocks: '1', extended: '1', fields: 'photo_50,photo_100' }, signal)
}

export const getCatalogSection = async (sectionId: string, nextFrom = '', signal?: AbortSignal): Promise<JSONObject> => {
  if (!/^[\w-]+$/.test(sectionId)) throw new VKApiError('format')
  return await request(`https://api.vk.ru/method/catalog.getSection?v=${QUERY_API_VERSION}&client_id=${VK_APP_ID}`, 'POST', {
    section_id: sectionId, need_blocks: '1', extended: '1', fields: 'photo_50,photo_100', ...(nextFrom.length > 0 ? { start_from: nextFrom } : {})
  }, signal)
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

export const request = async (url: string, method: 'GET' | 'POST', params: Record<string, string>, signal?: AbortSignal, expectedUserId?: string, expectedIdentity?: SessionIdentity): Promise<JSONObject> => {
  signal?.throwIfAborted()
  let details: VKApiErrorDetails = { operation: requestOperation(url), stage: 'token' }
  const controller = new AbortController()
  const cancel = (): void => { controller.abort(signal?.reason) }
  let identity: SessionIdentity | undefined
  const changed = (changes: Record<string, chrome.storage.StorageChange>, area: string): void => {
    if (area !== 'local' || identity == null) return
    if (('userId' in changes && (changes.userId.newValue ?? '') !== identity.userId) || ('sessionEpoch' in changes && (changes.sessionEpoch.newValue ?? 'legacy') !== identity.epoch)) controller.abort(new VKApiError('session-changed'))
  }
  signal?.addEventListener('abort', cancel, { once: true })
  chrome.storage.onChanged.addListener(changed)
  try {
    return await withTimeout(async requestSignal => {
      let session = await getSessionToken(requestSignal)
      identity = session.identity
      if (expectedIdentity != null && (identity.userId !== expectedIdentity.userId || identity.epoch !== expectedIdentity.epoch)) throw new VKApiError('session-changed')
      await requestSession({ kind: 'assert', identity }, requestSignal)
      for (let attempt = 0; attempt < 2; attempt++) {
        requestSignal.throwIfAborted()
        const token = session.token
        if (token.error?.type === 'unauthorized') throw new VKApiError('unauthorized')
        if (token.error != null) throw new VKApiError('unavailable')
        if (token.accessToken.length === 0 || token.userId.length === 0) throw new VKApiError('format')
        if (expectedUserId != null && token.userId !== expectedUserId) throw new VKApiError('unauthorized')
        const body = new URLSearchParams(params)
        body.set('access_token', token.accessToken)
        const target = new URL(url)
        const options: RequestInit = { method, signal: requestSignal }
        if (method === 'GET') body.forEach((value, key) => { target.searchParams.set(key, value) })
        else options.body = body
        try {
          details = { operation: requestOperation(url), stage: attempt === 0 ? 'request' : 'retry', attempt: attempt + 1 }
          const result = await performRequest(target.toString(), options, requestSignal, details)
          await requestSession({ kind: 'assert', identity }, requestSignal)
          return result
        } catch (error) {
          requestSignal.throwIfAborted()
          if (!(error instanceof VKApiError) || error.kind !== 'unauthorized' || attempt !== 0) throw error
          details = { operation: requestOperation(url), stage: 'refresh', attempt: 1 }
          session = await requestSession({ kind: 'refresh', identity, rejectedToken: token.accessToken }, requestSignal)
        }
      }
      throw new VKApiError('unauthorized')
    }, 15_000, controller.signal)
  } catch (error) {
    signal?.throwIfAborted()
    if (error instanceof VKApiError) throw withVKApiErrorDetails(error, details)
    if (error instanceof DOMException && error.name === 'TimeoutError') throw new VKApiError('timeout', details)
    throw new VKApiError('unavailable', details)
  } finally {
    signal?.removeEventListener('abort', cancel)
    chrome.storage.onChanged.removeListener(changed)
  }
}

const performRequest = async (url: string, options: RequestInit, signal: AbortSignal, context: VKApiErrorDetails): Promise<JSONObject> => {
  let response: Response
  try {
    response = await fetch(url, options)
  } catch {
    signal.throwIfAborted()
    throw new VKApiError('network', context)
  }
  signal.throwIfAborted()
  const details = { ...context, ...responseDetails(response) }
  if (!response.ok) throw new VKApiError(response.status === 401 ? 'unauthorized' : response.status === 429 ? 'rate-limit' : 'http', details)
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    signal.throwIfAborted()
    throw new VKApiError('format', details)
  }
  signal.throwIfAborted()
  if (!isJSONObjectValue(payload)) throw new VKApiError('format', details)
  if (payload.error != null) {
    if (!isJSONObjectValue(payload.error) || typeof payload.error.error_code !== 'number') throw new VKApiError('format', details)
    const code = payload.error.error_code
    throw new VKApiError(code === 5 ? 'unauthorized' : code === 6 || code === 9 ? 'rate-limit' : 'vk', { ...details, code })
  }
  if (!('response' in payload)) throw new VKApiError('format', details)
  return payload
}

export const fetchAppWebToken = async (signal?: AbortSignal): Promise<WebToken> => {
  const resp = await vkClientRequest('https://login.vk.ru/?act=web_token', {
    version: '1',
    app_id: VK_APP_ID,
    access_token: ''
  }, signal)

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
    throw new VKApiError('format', { operation: 'web_token', stage: 'token' })
  }
}

export const checkProfile = async (token: WebToken, signal: AbortSignal): Promise<boolean> => {
  const details = { operation: 'account.getProfileNavigationInfo', stage: 'profile', attempt: 1 }
  const params = new URLSearchParams({ app_id: VK_APP_ID, v: API_VERSION, access_token: token.accessToken })
  try {
    const payload = await performRequest(`https://api.vk.ru/method/account.getProfileNavigationInfo?v=${QUERY_API_VERSION}&client_id=${VK_APP_ID}`, { method: 'POST', body: params, signal }, signal, details)
    if (!isJSONObjectValue(payload.response)) throw new VKApiError('format', details)
    return true
  } catch (error) {
    signal.throwIfAborted()
    if (error instanceof VKApiError && error.kind === 'unauthorized') return false
    throw error
  }
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

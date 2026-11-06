import { expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'

it('sends settings and catalog Mix options in the same native options field for every recommendation', async () => {
  createChrome({ userId: '1', webToken: { accessToken: 'synthetic', userId: '1', expires: Number.MAX_SAFE_INTEGER, logoutHash: '', error: null } })
  const { startSessionService } = await import('../../packages/service-worker/src/session')
  startSessionService()
  const network = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => Response.json({ response: [{ owner_id: 1, id: 2, access_key: '', url: 'https://audio.invalid/test.mp3', thumb: { photo_68: '' }, artist: 'Artist', main_artists: [], title: 'Track', duration: 30, track_code: '' }] }))
  vi.stubGlobal('fetch', network)
  const { getStreamMixAudios } = await import('../../packages/common/src/vk-api-client')
  const options = JSON.stringify({ id: 123, additionals: ['rock'], vibes: ['happy'] })
  await getStreamMixAudios(undefined, 'common', options)
  await getStreamMixAudios(undefined, 'common', options)
  for (const [, init] of network.mock.calls) {
    const body = new URLSearchParams(String(init?.body))
    expect(body.get('options')).toBe(options)
    expect(body.has('mix_options')).toBe(false)
    expect(body.get('mix_id')).toBe('common')
  }
  await getStreamMixAudios(undefined, 'artist_mix', '', '12345')
  const artistBody = new URLSearchParams(String(network.mock.calls[2][1]?.body))
  expect(artistBody.get('entity_id')).toBe('12345')
  expect(artistBody.get('mix_id')).toBe('artist_mix')
})

it('sends the source audio identity for native track Mix recommendations', async () => {
  createChrome({ userId: '1', webToken: { accessToken: 'synthetic', userId: '1', expires: Number.MAX_SAFE_INTEGER, logoutHash: '', error: null } })
  const { startSessionService } = await import('../../packages/service-worker/src/session')
  startSessionService()
  const network = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => Response.json({ response: [{ owner_id: 1, id: 2, access_key: '', url: '', thumb: { photo_68: '' }, artist: 'Artist', main_artists: [], title: 'Track', duration: 30, track_code: '' }] }))
  vi.stubGlobal('fetch', network)
  const { getStreamMixAudios } = await import('../../packages/common/src/vk-api-client')
  await getStreamMixAudios(undefined, 'track_mix', '', '-2_20')
  const body = new URLSearchParams(String(network.mock.calls[0][1]?.body))
  expect(body.get('mix_id')).toBe('track_mix')
  expect(body.get('entity_id')).toBe('-2_20')
})

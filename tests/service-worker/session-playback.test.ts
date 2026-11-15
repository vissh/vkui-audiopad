// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { clearPlaybackMocks, playbackHarness, playlist, track } from '../helpers/playback'
import { installAudio } from '../helpers/audio'

afterEach(clearPlaybackMocks)

it.each([true, false])('pauses existing media before publishing a verified new account with offscreen=%s', async offscreen => {
  const page = await playbackHarness({ userId: '1', sessionEpoch: 'one', playbackId: 'media', activeTrack: track('1_1'), currentPlaylist: playlist(['1_1']), audiosIds: [['1_1', '']], played: true }, { realState: true })
  page.api.runtime.getContexts.mockResolvedValue([{ documentUrl: 'offscreen.html' }])
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/environment.json')) return new Response(JSON.stringify({ 'offscreen-document-support': offscreen }))
    if (url.startsWith('https://login.vk.ru/')) return new Response(JSON.stringify({ type: 'okay', data: { user_id: '2', access_token: 'synthetic-only', expires: Number.MAX_SAFE_INTEGER, logout_hash: '' } }))
    if (url.startsWith('https://api.vk.ru/method/account.getProfileNavigationInfo')) return new Response('{"response":{}}')
    throw new Error('Unexpected test URL')
  }))
  document.body.replaceChildren(Object.assign(document.createElement('div'), { id: 'custom-events' }))
  installAudio()
  const { replaceAudio } = await import('../../packages/offscreen/src/audio-element')
  const audio = replaceAudio('media')
  Object.assign(audio, { paused: false, src: 'https://audio.invalid/source.mp3' })
  const { startListeningMessages } = await import('../../packages/offscreen/src/listeners/messages')
  startListeningMessages()
  const { loadState } = await import('../../packages/service-worker/src/state')
  await loadState()
  const { retireSessionPlayback } = await import('../../packages/service-worker/src/session-playback')
  const { createSessionOwner } = await import('../../packages/service-worker/src/session')
  const owner = createSessionOwner(retireSessionPlayback)
  const result = await owner.request({ kind: 'verify' }, new AbortController().signal)
  expect(result.identity.userId).toBe('2')
  expect(audio.paused).toBe(true)
  expect(page.snapshot().userId).toBe('2')
  expect(page.snapshot()).not.toHaveProperty('currentPlaylist')
  expect(page.api.offscreen.createDocument).not.toHaveBeenCalled()
})

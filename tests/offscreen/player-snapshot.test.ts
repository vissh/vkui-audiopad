// @vitest-environment jsdom
import { commonTypes } from '@vk-audiopad/common'
import { expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { installAudio } from '../helpers/audio'

it.each([true, false])('reads existing Audio over the real snapshot transport with offscreen=%s', async offscreen => {
  const browser = createChrome()
  document.body.replaceChildren(Object.assign(document.createElement('div'), { id: 'custom-events' }))
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ 'offscreen-document-support': offscreen }))))
  browser.api.runtime.getContexts.mockResolvedValue([{ documentUrl: 'offscreen.html' }])
  const audios = installAudio()
  const { replaceAudio } = await import('../../packages/offscreen/src/audio-element')
  replaceAudio('media')
  const audio = audios.at(-1)!
  Object.assign(audio, { src: 'https://audio.invalid/source.mp3', paused: false, currentTime: 12, duration: 30 })
  const { startListeningMessages } = await import('../../packages/offscreen/src/listeners/messages')
  startListeningMessages()
  const { requestPlayerSnapshot } = await import('../../packages/service-worker/src/offscreen/player-snapshot')
  const before = browser.api.runtime.onMessage.addListener.mock.calls.length
  const acceptMedia = vi.fn()
  expect(await requestPlayerSnapshot(offscreen, acceptMedia)).toEqual({
    documentId: expect.any(String),
    activityRevision: 0,
    idle: false,
    playbackId: 'media',
    hasSource: true,
    requested: true,
    paused: false,
    playing: true,
    ended: false,
    failed: false,
    currentTime: 12,
    duration: 30
  })
  expect(acceptMedia).toHaveBeenCalledOnce()
  expect(browser.api.runtime.onMessage.removeListener).toHaveBeenCalledOnce()
  expect(browser.api.runtime.onMessage.addListener).toHaveBeenCalledTimes(before + 1)
  expect(audio.play).not.toHaveBeenCalled()
  expect(browser.api.offscreen.createDocument).not.toHaveBeenCalled()
  const sent = JSON.stringify(browser.api.runtime.sendMessage.mock.calls)
  expect(sent).not.toContain('audio.invalid')
  if (offscreen) expect(sent).toContain(commonTypes.MessageType.PLAYER_SNAPSHOT)
})

it('does not create an absent offscreen document just to inspect it', async () => {
  const browser = createChrome()
  const { requestPlayerSnapshot } = await import('../../packages/service-worker/src/offscreen/player-snapshot')
  expect(await requestPlayerSnapshot(true, vi.fn())).toBeNull()
  expect(browser.api.offscreen.createDocument).not.toHaveBeenCalled()
  expect(browser.api.runtime.sendMessage).not.toHaveBeenCalled()
})

it('times out without leaking its listener and ignores unrelated snapshots', async () => {
  vi.useFakeTimers()
  const browser = createChrome()
  browser.api.runtime.getContexts.mockResolvedValue([{ documentUrl: 'offscreen.html' }])
  const { requestPlayerSnapshot } = await import('../../packages/service-worker/src/offscreen/player-snapshot')
  const pending = requestPlayerSnapshot(true, vi.fn())
  const checked = expect(pending).rejects.toThrow('Player snapshot unavailable')
  await vi.advanceTimersByTimeAsync(0)
  await browser.api.runtime.sendMessage({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.PLAYER_SNAPSHOT, requestId: 'unrelated' })
  await vi.runAllTimersAsync()
  await checked
  expect(browser.api.runtime.onMessage.removeListener).toHaveBeenCalledOnce()
  expect(vi.getTimerCount()).toBe(0)
})

it('rejects a malformed matching response and removes its listener and timeout', async () => {
  vi.useFakeTimers()
  const browser = createChrome()
  browser.api.runtime.getContexts.mockResolvedValue([{ documentUrl: 'offscreen.html' }])
  browser.api.runtime.onMessage.addListener(async (message: unknown) => {
    const request = message as { type: string, requestId: string }
    if (request.type === commonTypes.MessageType.GET_PLAYER_SNAPSHOT) {
      await browser.api.runtime.sendMessage({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.PLAYER_SNAPSHOT, requestId: request.requestId, snapshot: { duration: NaN } })
    }
  })
  const { requestPlayerSnapshot } = await import('../../packages/service-worker/src/offscreen/player-snapshot')
  await expect(requestPlayerSnapshot(true, vi.fn())).rejects.toThrow('Player snapshot unavailable')
  expect(browser.api.runtime.onMessage.removeListener).toHaveBeenCalledOnce()
  expect(vi.getTimerCount()).toBe(0)
})

it('cleans up when the Firefox bridge cannot be installed', async () => {
  vi.useFakeTimers()
  const browser = createChrome()
  document.body.replaceChildren()
  const { requestPlayerSnapshot } = await import('../../packages/service-worker/src/offscreen/player-snapshot')
  await expect(requestPlayerSnapshot(false, vi.fn())).rejects.toThrow('Player snapshot unavailable')
  expect(browser.api.runtime.onMessage.removeListener).toHaveBeenCalledOnce()
  expect(vi.getTimerCount()).toBe(0)
})

it.each([true, false])('launches a source only after the real listener handshake with offscreen=%s', async offscreen => {
  const browser = createChrome()
  document.body.replaceChildren(Object.assign(document.createElement('div'), { id: 'custom-events' }))
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ 'offscreen-document-support': offscreen }))))
  const audios = installAudio()
  const { startListeningMessages } = await import('../../packages/offscreen/src/listeners/messages')
  startListeningMessages()
  const { playTrack } = await import('../../packages/service-worker/src/offscreen/play-track')
  await playTrack('https://audio.invalid/source.mp3', 0.3, 'new-media', () => true)
  const { getPlayerSnapshot } = await import('../../packages/offscreen/src/player-snapshot')
  expect(getPlayerSnapshot()).toMatchObject({ playbackId: 'new-media', hasSource: true, playing: true, idle: false })
  expect(audios.at(-1)!.src).toBe('https://audio.invalid/source.mp3')
  expect(audios.at(-1)!.volume).toBe(0.3)
  expect(browser.api.offscreen.createDocument).toHaveBeenCalledTimes(offscreen ? 1 : 0)
})

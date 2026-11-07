import { type commonTypes } from '@vk-audiopad/common'
import { expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { deferred } from '../helpers/deferred'
import { answerSnapshots, snapshot } from '../helpers/offscreen'

it('checks command ownership again after offscreen creation completes', async () => {
  const browser = createChrome()
  const received = vi.fn()
  browser.api.runtime.onMessage.addListener(message => received(message))
  answerSnapshots(browser)
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"offscreen-document-support":true}')))
  const ready = deferred<void>()
  const create = browser.api.offscreen.createDocument.getMockImplementation()!
  browser.api.offscreen.createDocument.mockImplementationOnce(async options => { await ready.promise; await create(options) })
  const { playTrack } = await import('../../packages/service-worker/src/offscreen/play-track')
  let active = 'old'
  const old = playTrack('old.mp3', 0.5, 'old-id', () => active === 'old')
  await vi.waitFor(() => { expect(browser.api.offscreen.createDocument).toHaveBeenCalledOnce() })
  active = 'new'
  const next = playTrack('new.mp3', 0.5, 'new-id', () => active === 'new')
  ready.resolve()
  await Promise.all([old, next])
  expect(received.mock.calls.filter(([message]) => message.type === 'play-track')).toHaveLength(1)
  expect(received).toHaveBeenCalledWith(expect.objectContaining({ url: 'new.mp3', playbackId: 'new-id' }))
})

it('waits for listeners after document creation and cancels obsolete delivery while waiting', async () => {
  vi.useFakeTimers()
  const browser = createChrome()
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"offscreen-document-support":true}')))
  let listening = false
  answerSnapshots(browser, () => listening ? snapshot() : null)
  const { playTrack } = await import('../../packages/service-worker/src/offscreen/play-track')
  let current = 'old'
  const old = playTrack('old.mp3', 0.5, 'old', () => current === 'old')
  await vi.advanceTimersByTimeAsync(0)
  expect(browser.api.offscreen.createDocument).toHaveBeenCalledOnce()
  expect(browser.api.runtime.sendMessage.mock.calls.some(([message]) => (message as { type: string }).type === 'play-track')).toBe(false)
  current = 'new'
  const next = playTrack('new.mp3', 0.5, 'new', () => current === 'new')
  await vi.advanceTimersByTimeAsync(50)
  await old
  listening = true
  await vi.advanceTimersByTimeAsync(50)
  await next
  expect(browser.api.runtime.sendMessage.mock.calls.filter(([message]) => (message as { type: string }).type === 'play-track')).toEqual([[expect.objectContaining({ playbackId: 'new' })]])
  expect(vi.getTimerCount()).toBe(0)
})

it('bounds readiness waiting and allows a later command after the timeout', async () => {
  vi.useFakeTimers()
  const browser = createChrome()
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"offscreen-document-support":true}')))
  let listening = false
  answerSnapshots(browser, () => listening ? snapshot() : null)
  const { playTrack } = await import('../../packages/service-worker/src/offscreen/play-track')
  const waiting = expect(playTrack('old.mp3', 0.5, 'old', () => true)).rejects.toThrow('Player snapshot unavailable')
  await vi.runAllTimersAsync()
  await waiting
  expect(browser.api.runtime.sendMessage.mock.calls.some(([message]) => (message as { type: string }).type === 'play-track')).toBe(false)
  expect(vi.getTimerCount()).toBe(0)
  listening = true
  await playTrack('new.mp3', 0.5, 'new', () => true)
  expect(browser.api.runtime.sendMessage.mock.calls.filter(([message]) => (message as { type: string }).type === 'play-track')).toEqual([[expect.objectContaining({ playbackId: 'new' })]])
  expect(vi.getTimerCount()).toBe(0)
})

it('uses the latest equalizer settings after document creation and readiness', async () => {
  const browser = createChrome()
  answerSnapshots(browser)
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"offscreen-document-support":true}')))
  const ready = deferred<void>()
  const create = browser.api.offscreen.createDocument.getMockImplementation()!
  browser.api.offscreen.createDocument.mockImplementationOnce(async options => { await ready.promise; await create(options) })
  const { applicationState } = await import('../../packages/service-worker/src/state')
  const { playTrack } = await import('../../packages/service-worker/src/offscreen/play-track')
  const pending = playTrack('source.mp3', 0.5, 'source', () => true)
  await vi.waitFor(() => { expect(browser.api.offscreen.createDocument).toHaveBeenCalledOnce() })
  applicationState.equalizer = { enabled: true, gains: [6, 5, 4, 2, 0, 0, -1, -1, 0, 0], preamp: -3, autoGain: false, userPresets: [], presetId: '', mixAccessDenied: false }
  ready.resolve()
  await pending
  expect(browser.api.runtime.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
    type: 'play-track', equalizer: { enabled: true, gains: [6, 5, 4, 2, 0, 0, -1, -1, 0, 0], preamp: -3, autoGain: false, userPresets: [], presetId: '', mixAccessDenied: false }
  }))
})

it.each([true, false])('rechecks playback ownership and settings after the permission query, offscreen=%s', async offscreen => {
  const browser = createChrome()
  if (!offscreen) {
    const { commonUtils } = await import('@vk-audiopad/common')
    vi.spyOn(commonUtils, 'sendBackgroundMessage').mockImplementation(message => { browser.api.runtime.sendMessage(message).catch(() => {}) })
    vi.spyOn(commonUtils, 'addBackgroundMessageListener').mockImplementation(listener => {
      const forward = (message: unknown): void => { listener(message as commonTypes.Message) }
      browser.api.runtime.onMessage.addListener(forward)
      return () => { browser.api.runtime.onMessage.removeListener(forward) }
    })
  }
  answerSnapshots(browser)
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ 'offscreen-document-support': offscreen }))))
  const permission = deferred<boolean>()
  browser.api.permissions.contains.mockImplementationOnce(async () => await permission.promise)
  const { playTrack } = await import('../../packages/service-worker/src/offscreen/play-track')
  let current = true
  const pending = playTrack('https://vd123.okcdn.ru/source.mp3', 0.5, 'old', () => current)
  await vi.waitFor(() => { expect(browser.api.permissions.contains).toHaveBeenCalledOnce() })
  current = false
  permission.resolve(true)
  await pending
  expect(browser.api.runtime.sendMessage.mock.calls.filter(([message]) => (message as { type: string }).type === 'play-track')).toEqual([])
  const { applicationState } = await import('../../packages/service-worker/src/state')
  const latest = deferred<boolean>()
  browser.api.permissions.contains.mockImplementationOnce(async () => await latest.promise)
  const next = playTrack('source.mp3', 0.5, 'new', () => true)
  await vi.waitFor(() => { expect(browser.api.permissions.contains).toHaveBeenCalledTimes(2) })
  applicationState.equalizer.enabled = true
  latest.resolve(false)
  await next
  expect(browser.api.runtime.sendMessage).toHaveBeenCalledWith(expect.objectContaining({ playbackId: 'new', equalizerMixAccess: false, equalizer: expect.objectContaining({ enabled: true }) }))
})

import { expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { deferred } from '../helpers/deferred'
import { answerSnapshots, snapshot } from '../helpers/offscreen'

it('checks command ownership again after offscreen creation completes', async () => {
  const browser = createChrome()
  const received = vi.fn()
  browser.api.runtime.onMessage.addListener(received)
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

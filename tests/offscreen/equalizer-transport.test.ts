// @vitest-environment jsdom
import { commonTypes, commonUtils } from '@vk-audiopad/common'
import { expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { installAudio } from '../helpers/audio'

it.each([true, false])('applies settings and publishes status without offscreen storage APIs, offscreen=%s', async offscreen => {
  const browser = createChrome()
  document.body.replaceChildren(Object.assign(document.createElement('div'), { id: 'custom-events' }))
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ 'offscreen-document-support': offscreen }))))
  installAudio()
  browser.api.runtime.getContexts.mockResolvedValue([{ documentUrl: 'offscreen.html' }])
  const { startListeningMessages } = await import('../../packages/offscreen/src/listeners/messages')
  const { updateEqualizer } = await import('../../packages/service-worker/src/offscreen/update-equalizer')
  startListeningMessages()
  const received = vi.fn()
  browser.api.runtime.onMessage.addListener(message => { received(message) })
  commonUtils.addBackgroundMessageListener(received)
  Object.defineProperty(browser.api, 'storage', { get: () => { throw new Error('Offscreen has only chrome.runtime') } })
  await updateEqualizer({ enabled: true, gains: [6, 4, 0, -1, 0] })
  await vi.waitFor(() => { expect(received).toHaveBeenCalledWith(expect.objectContaining({ type: commonTypes.MessageType.EQUALIZER_STATUS, status: 'waiting' })) })
  await updateEqualizer({ enabled: false, gains: [6, 4, 0, -1, 0] })
  await vi.waitFor(() => { expect(received).toHaveBeenCalledWith(expect.objectContaining({ type: commonTypes.MessageType.EQUALIZER_STATUS, status: 'off' })) })
})

it('does not create an audio document when settings change without a player', async () => {
  const browser = createChrome()
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"offscreen-document-support":true}')))
  const { updateEqualizer } = await import('../../packages/service-worker/src/offscreen/update-equalizer')
  await updateEqualizer({ enabled: true })
  expect(browser.api.offscreen.createDocument).not.toHaveBeenCalled()
  expect(browser.api.runtime.sendMessage).not.toHaveBeenCalled()
})

it.each([true, false])('forwards explicit source retry separately from preset edits, offscreen=%s', async offscreen => {
  const browser = createChrome()
  document.body.replaceChildren(Object.assign(document.createElement('div'), { id: 'custom-events' }))
  installAudio()
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ 'offscreen-document-support': offscreen }))))
  await commonUtils.offscreenDocumentSupport()
  browser.api.runtime.getContexts.mockResolvedValue([{ documentUrl: 'offscreen.html' }])
  const { startListeningMessages } = await import('../../packages/offscreen/src/listeners/messages')
  const { setEqualizerSource } = await import('../../packages/offscreen/src/equalizer')
  const { updateEqualizer } = await import('../../packages/service-worker/src/offscreen/update-equalizer')
  startListeningMessages()
  const settings = { enabled: true, gains: [6, 4, 0, -1, 0] }
  await updateEqualizer(settings)
  const fetcher = vi.fn(async () => { throw new TypeError('Denied') })
  vi.stubGlobal('fetch', fetcher)
  await setEqualizerSource(new Audio(), 'https://vd123.okcdn.ru/current.mp3', false, () => {})
  await updateEqualizer({ ...settings, gains: [0, 0, 0, 0, 0] })
  expect(fetcher).toHaveBeenCalledOnce()
  await updateEqualizer(settings, true)
  await vi.waitFor(() => { expect(fetcher).toHaveBeenCalledTimes(2) })
})

it('retains user settings while clearing transient audio status on update/account cleanup', async () => {
  const settings = { enabled: true, gains: [6, 5, 4, 2, 0, 0, -1, -1, 0, 0], preamp: -3, autoGain: false, mixAccessDenied: true, userPresets: [{ id: 'a', name: 'Наушники', gains: [7, 5, 4, 2, 0, 0, -1, -1, 0, 0], preamp: -4 }, { id: 'b', name: 'Колонки', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], preamp: 0 }] }
  const browser = createChrome({ equalizer: settings, equalizerStatus: 'active', played: true })
  await commonUtils.clearStorage()
  expect(browser.snapshot()).toEqual({ equalizer: settings })
})

it.each([true, false])('retries DSP configuration after a permission grant without changing playback, offscreen=%s', async offscreen => {
  const browser = createChrome({ played: true, currentTime: 12, playbackId: 'current' })
  document.body.replaceChildren(Object.assign(document.createElement('div'), { id: 'custom-events' }))
  const retry = vi.fn(async (_value: unknown) => {})
  vi.doMock('../../packages/service-worker/src/offscreen/update-equalizer', () => ({ updateEqualizer: retry }))
  try {
    const { startListeningMessages } = await import('../../packages/service-worker/src/listeners/messages')
    const { immediateReadiness } = await import('../../packages/service-worker/src/readiness')
    const { applicationState } = await import('../../packages/service-worker/src/state')
    await startListeningMessages(immediateReadiness, offscreen)
    const message: commonTypes.RetryEqualizerMessage = { target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.RETRY_EQUALIZER }
    if (offscreen) await browser.api.runtime.sendMessage(message)
    else commonUtils.sendBackgroundMessage(message)
    await vi.waitFor(() => { expect(retry).toHaveBeenCalledWith(applicationState.equalizer, true) })
    expect(browser.snapshot()).toEqual({ played: true, currentTime: 12, playbackId: 'current' })
  } finally {
    vi.doUnmock('../../packages/service-worker/src/offscreen/update-equalizer')
  }
})

it.each([true, false])('skips ungranted Mix downloads on every track and retries after a grant, offscreen=%s', async offscreen => {
  const browser = createChrome()
  document.body.replaceChildren(Object.assign(document.createElement('div'), { id: 'custom-events' }))
  const audios = installAudio()
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ 'offscreen-document-support': offscreen }))))
  const { commonUtils } = await import('@vk-audiopad/common')
  await commonUtils.offscreenDocumentSupport()
  browser.api.runtime.getContexts.mockResolvedValue([{ documentUrl: 'offscreen.html' }])
  browser.api.permissions.contains.mockResolvedValue(false)
  const { startListeningMessages } = await import('../../packages/offscreen/src/listeners/messages')
  const { playTrack } = await import('../../packages/service-worker/src/offscreen/play-track')
  const { updateEqualizer } = await import('../../packages/service-worker/src/offscreen/update-equalizer')
  const { applicationState } = await import('../../packages/service-worker/src/state')
  const { equalizer } = await import('@vk-audiopad/common')
  applicationState.equalizer = { ...equalizer.defaults, enabled: true }
  startListeningMessages()
  const received = vi.fn()
  browser.api.runtime.onMessage.addListener(message => { received(message) })
  commonUtils.addBackgroundMessageListener(received)
  const fetcher = vi.fn(async () => { throw new TypeError('CDN unavailable') })
  vi.stubGlobal('fetch', fetcher)
  for (const track of ['first', 'second']) {
    const url = `https://vd123.okcdn.ru/${track}.mp3`
    await playTrack(url, 0.5, track, () => true)
    await vi.waitFor(() => { expect(audios.at(-1)!.play).toHaveBeenCalledOnce() })
    expect(audios.at(-1)!.src).toBe(url)
    expect(audios.at(-1)!.crossOrigin).toBeNull()
    await updateEqualizer({ ...applicationState.equalizer, gains: equalizer.presets.bass })
    await updateEqualizer({ ...applicationState.equalizer, enabled: false })
    await updateEqualizer(applicationState.equalizer, true)
  }
  expect(fetcher).not.toHaveBeenCalled()
  expect(received).toHaveBeenCalledWith(expect.objectContaining({ type: commonTypes.MessageType.EQUALIZER_STATUS, status: 'unavailable' }))
  const audio = audios.at(-1)!
  audio.currentTime = 42
  browser.api.permissions.contains.mockResolvedValue(true)
  await updateEqualizer(applicationState.equalizer, true)
  await vi.waitFor(() => { expect(fetcher).toHaveBeenCalledOnce() })
  expect(fetcher).toHaveBeenCalledWith('https://vd123.okcdn.ru/second.mp3', expect.anything())
  expect(audio.currentTime).toBe(42)
  expect(audio.play).toHaveBeenCalledOnce()
  expect(audios.at(-1)).toBe(audio)
  expect(browser.api.permissions.contains).toHaveBeenCalledWith({ origins: ['https://*.okcdn.ru/*'] })
})

it('fails closed when the permission check rejects', async () => {
  const browser = createChrome()
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"offscreen-document-support":true}')))
  browser.api.runtime.getContexts.mockResolvedValue([{ documentUrl: 'offscreen.html' }])
  const { answerSnapshots } = await import('../helpers/offscreen')
  answerSnapshots(browser)
  browser.api.permissions.contains.mockRejectedValue(new Error('Permission unavailable'))
  const { updateEqualizer } = await import('../../packages/service-worker/src/offscreen/update-equalizer')
  await updateEqualizer({ enabled: true })
  expect(browser.api.runtime.sendMessage).toHaveBeenCalledWith(expect.objectContaining({ type: commonTypes.MessageType.CHANGE_EQUALIZER, equalizerMixAccess: false }))
})

it.each([true, false])('does not deliver stale EQ settings after a delayed permission query, offscreen=%s', async offscreen => {
  const browser = createChrome()
  const { commonUtils } = await import('@vk-audiopad/common')
  document.body.replaceChildren(Object.assign(document.createElement('div'), { id: 'custom-events' }))
  installAudio()
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ 'offscreen-document-support': offscreen }))))
  const { startListeningMessages } = await import('../../packages/offscreen/src/listeners/messages')
  const { updateEqualizer } = await import('../../packages/service-worker/src/offscreen/update-equalizer')
  const { deferred } = await import('../helpers/deferred')
  startListeningMessages()
  browser.api.runtime.getContexts.mockResolvedValue([{ documentUrl: 'offscreen.html' }])
  const permission = deferred<boolean>()
  browser.api.permissions.contains.mockImplementationOnce(async () => await permission.promise)
  const received = vi.fn()
  browser.api.runtime.onMessage.addListener(message => { received(message) })
  commonUtils.addBackgroundMessageListener(received)
  const old = updateEqualizer({ enabled: true })
  await vi.waitFor(() => { expect(browser.api.permissions.contains).toHaveBeenCalledOnce() })
  const latest = updateEqualizer({ enabled: false })
  if (!offscreen) await latest
  permission.resolve(true)
  await Promise.all([old, latest])
  const messages = received.mock.calls.map(([message]) => message as commonTypes.Message).filter(message => message.type === commonTypes.MessageType.CHANGE_EQUALIZER)
  expect(messages).toEqual([expect.objectContaining({ value: expect.objectContaining({ enabled: false }) })])
})

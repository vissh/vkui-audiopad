import { equalizer } from '@vk-audiopad/common'
import { expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { installAudio } from '../helpers/audio'
import { deferred } from '../helpers/deferred'

const enabled = { enabled: true, gains: [6, 5, 4, 2, 0, 0, -1, -1, 0, 0], preamp: 0, autoGain: true }

class Parameter {
  value = 0
  cancelScheduledValues = vi.fn()
  setTargetAtTime = vi.fn((value: number) => { this.value = value })
}
class Node {
  gain = new Parameter()
  frequency = new Parameter()
  Q = new Parameter()
  type = ''
  connect = vi.fn()
  disconnect = vi.fn()
}
class Context {
  static instances: Context[] = []
  destination = new Node()
  currentTime = 1
  sampleRate = 48000
  nodes: Node[] = []
  filters: Node[] = []
  preamp = new Node()
  resume = vi.fn(async () => {})
  createGain = () => this.preamp
  createBiquadFilter = () => { const node = new Node(); this.filters.push(node); return node }
  createMediaElementSource = vi.fn(() => { const node = new Node(); this.nodes.push(node); return node })
  constructor () { Context.instances.push(this) }
}

const setup = async (settings: unknown = enabled) => {
  const browser = createChrome({ equalizer: settings })
  installAudio()
  Context.instances = []
  vi.stubGlobal('AudioContext', Context)
  const eq = await import('../../packages/offscreen/src/equalizer')
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"offscreen-document-support":true}')))
  browser.api.runtime.onMessage.addListener(async (message: unknown) => {
    const data = message as { type: string, status: string }
    if (data.type === 'equalizer-status') await browser.api.storage.local.set({ equalizerStatus: data.status })
  })
  const { commonUtils } = await import('@vk-audiopad/common')
  await commonUtils.offscreenDocumentSupport()
  eq.changeEqualizer(settings, false, true)
  const audio = new Audio()
  const play = vi.fn()
  return { ...eq, browser, audio, play }
}

it('restores saved settings, changes live bands and bypasses without recreating media', async () => {
  const player = await setup()
  player.setEqualizerSource(player.audio, 'index.m3u8', true, player.play)
  await vi.waitFor(() => { expect(player.browser.snapshot().equalizerStatus).toBe('active') })
  const context = Context.instances[0]
  expect(context.filters.map(filter => filter.frequency.value)).toEqual([32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000])
  expect(context.filters.map(filter => filter.type)).toEqual(['lowshelf', ...Array(8).fill('peaking'), 'highshelf'])
  expect(context.filters.map(filter => filter.gain.value)).toEqual(enabled.gains)
  expect(context.preamp.gain.cancelScheduledValues).toHaveBeenCalledOnce()
  expect(context.preamp.gain.setTargetAtTime).not.toHaveBeenCalled()
  expect(context.preamp.gain.value).toBeCloseTo(equalizer.headroom({ ...equalizer.defaults, ...enabled, gains: [...equalizer.presets.bass] }))
  player.changeEqualizer({ enabled: false, gains: enabled.gains })
  await vi.waitFor(() => { expect(player.browser.snapshot().equalizerStatus).toBe('off') })
  expect(context.filters.map(filter => filter.gain.value)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  expect(context.preamp.gain.value).toBe(1)
  player.changeEqualizer({ ...enabled, gains: [-2, 0, 4, 3, -1, 0, 0, 0, 0, 0], preamp: -5, autoGain: false })
  await vi.waitFor(() => { expect(context.filters[2].gain.value).toBe(4) })
  expect(context.preamp.gain.value).toBeCloseTo(10 ** (-5 / 20))
  expect(context.createMediaElementSource).toHaveBeenCalledOnce()
  expect(player.audio.crossOrigin).toBeNull()
  expect(player.play).not.toHaveBeenCalled()
})

it('disconnects replaced sources and reuses one context for later tracks', async () => {
  const player = await setup()
  player.setEqualizerSource(player.audio, 'index.m3u8', true, player.play)
  await vi.waitFor(() => { expect(Context.instances[0]?.nodes).toHaveLength(1) })
  player.setEqualizerSource(new Audio(), 'next/index.m3u8', true, player.play)
  await vi.waitFor(() => { expect(Context.instances[0].nodes).toHaveLength(2) })
  expect(Context.instances).toHaveLength(1)
  expect(Context.instances[0].nodes[0].disconnect).toHaveBeenCalledOnce()
})

it('leaves native playback untouched if a direct CDN fetch is denied', async () => {
  const player = await setup()
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('CORS') }))
  player.audio.src = 'https://audio.invalid/source.mp3'
  player.setEqualizerSource(player.audio, player.audio.src, false, player.play)
  await vi.waitFor(() => { expect(player.browser.snapshot().equalizerStatus).toBe('unavailable') })
  expect(player.audio.src).toBe('https://audio.invalid/source.mp3')
  expect(Context.instances).toHaveLength(0)
  expect(player.play).not.toHaveBeenCalled()
})

it('keeps an unavailable source stable across preset edits and retries only on explicit request', async () => {
  const player = await setup()
  const fetcher = vi.fn(async () => { throw new TypeError('No access') })
  vi.stubGlobal('fetch', fetcher)
  player.audio.src = 'https://vd123.okcdn.ru/current.mp3'
  await player.setEqualizerSource(player.audio, player.audio.src, false, player.play)
  await vi.waitFor(() => { expect(player.browser.snapshot().equalizerStatus).toBe('unavailable') })
  await player.browser.api.storage.local.get('equalizerStatus')
  const states: unknown[] = []
  player.browser.api.storage.local.onChanged.addListener(changes => {
    if (changes.equalizerStatus != null) states.push(changes.equalizerStatus.newValue)
  })
  for (const gains of [equalizer.presets.rock, equalizer.presets.flat, equalizer.presets.bass]) {
    player.changeEqualizer({ ...enabled, gains })
    await Promise.resolve()
  }
  expect(fetcher).toHaveBeenCalledOnce()
  expect(states).toEqual([])
  expect(player.browser.snapshot().equalizerStatus).toBe('unavailable')
  player.changeEqualizer(enabled, true, true)
  await vi.waitFor(() => { expect(fetcher).toHaveBeenCalledTimes(2) })
  await vi.waitFor(() => { expect(player.browser.snapshot().equalizerStatus).toBe('unavailable') })
})

it('prepares local media before startup without a second play on metadata', async () => {
  const player = await setup()
  vi.stubGlobal('fetch', vi.fn(async () => new Response('media', { headers: { 'content-type': 'audio/mpeg' } })))
  const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:local')
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  player.audio.currentTime = 42
  player.setEqualizerSource(player.audio, 'source.mp3', false, player.play)
  await vi.waitFor(() => { expect(player.browser.snapshot().equalizerStatus).toBe('active') })
  expect(player.audio.src).toBe('blob:local')
  player.audio.currentTime = 0
  player.audio.dispatchEvent(new Event('loadedmetadata'))
  expect(player.audio.currentTime).toBe(0)
  expect(player.play).not.toHaveBeenCalled()
  player.clearEqualizerSource()
  expect(create).toHaveBeenCalledOnce()
  expect(revoke).toHaveBeenCalledWith('blob:local')
})

it('ignores a late download after source replacement even if fetch ignores cancellation', async () => {
  const player = await setup()
  const response = deferred<Response>()
  const fetcher = vi.fn(async () => await response.promise)
  vi.stubGlobal('fetch', fetcher)
  const create = vi.spyOn(URL, 'createObjectURL')
  player.setEqualizerSource(player.audio, 'old.mp3', false, player.play)
  await vi.waitFor(() => { expect(fetcher).toHaveBeenCalledOnce() })
  player.setEqualizerSource(new Audio(), 'index.m3u8', true, player.play)
  response.resolve(new Response('media'))
  await vi.waitFor(() => { expect(player.browser.snapshot().equalizerStatus).toBe('active') })
  expect(create).not.toHaveBeenCalled()
  expect((fetcher.mock.calls[0] as unknown as [string, RequestInit])[1].signal?.aborted).toBe(true)
})

it('does not allocate a graph or download media with the default disabled setting', async () => {
  const player = await setup(null)
  player.setEqualizerSource(player.audio, 'source.mp3', false, player.play)
  expect(Context.instances).toHaveLength(0)
  expect(fetch).not.toHaveBeenCalledWith('source.mp3', expect.anything())
})

it('applies a permission retry to the current native source at the same position after both metadata and DSP are ready', async () => {
  const player = await setup()
  player.changeEqualizer(enabled, false, false)
  player.audio.src = 'https://vd123.okcdn.ru/current.mp3'
  await player.setEqualizerSource(player.audio, player.audio.src, false, player.play)
  await vi.waitFor(() => { expect(player.browser.snapshot().equalizerStatus).toBe('unavailable') })
  expect(fetch).not.toHaveBeenCalledWith(player.audio.src, expect.anything())
  player.audio.currentTime = 42
  const ready = deferred<void>()
  vi.stubGlobal('AudioContext', class extends Context { resume = vi.fn(async () => { await ready.promise }) })
  vi.stubGlobal('fetch', vi.fn(async () => new Response('media')))
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:current')
  player.changeEqualizer(enabled, true, true)
  await vi.waitFor(() => { expect(player.audio.src).toBe('blob:current') })
  player.audio.currentTime = 0
  player.audio.dispatchEvent(new Event('loadedmetadata'))
  expect(player.audio.currentTime).toBe(42)
  expect(player.play).not.toHaveBeenCalled()
  ready.resolve()
  await vi.waitFor(() => { expect(player.play).toHaveBeenCalledOnce() })
  expect(player.browser.snapshot().equalizerStatus).toBe('active')
})

it('resumes converted media without processing if the audio context cannot be prepared', async () => {
  const player = await setup({ enabled: false })
  player.audio.src = 'https://vd123.okcdn.ru/current.mp3'
  await player.setEqualizerSource(player.audio, player.audio.src, false, player.play)
  player.audio.currentTime = 42
  vi.stubGlobal('AudioContext', class extends Context { resume = vi.fn(async () => { throw new Error('Context unavailable') }) })
  vi.stubGlobal('fetch', vi.fn(async () => new Response('media')))
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:current')
  player.changeEqualizer(enabled, false, true)
  await vi.waitFor(() => { expect(player.browser.snapshot().equalizerStatus).toBe('unavailable') })
  player.audio.currentTime = 0
  player.audio.dispatchEvent(new Event('loadedmetadata'))
  expect(player.audio.currentTime).toBe(42)
  expect(player.play).toHaveBeenCalledOnce()
})

it('ignores the native play rejection caused by local media conversion and respects pause', async () => {
  const browser = createChrome()
  const audios = installAudio()
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"offscreen-document-support":true}')))
  const { commonUtils } = await import('@vk-audiopad/common')
  await commonUtils.offscreenDocumentSupport()
  vi.stubGlobal('AudioContext', Context)
  const response = deferred<Response>()
  vi.stubGlobal('fetch', vi.fn(async () => await response.promise))
  const messages = vi.fn()
  browser.api.runtime.onMessage.addListener(messages)
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:local')
  const { changeEqualizer } = await import('../../packages/offscreen/src/equalizer')
  changeEqualizer({ enabled: false })
  const { playTrack } = await import('../../packages/offscreen/src/handlers/play-track')
  const { playOrPause } = await import('../../packages/offscreen/src/handlers/play-or-pause')
  const pendingPlay = deferred<void>()
  // The Audio created for the new source has an unresolved native play request.
  const { listenToAudio } = await import('../../packages/offscreen/src/audio-element')
  listenToAudio(() => {
    audios.at(-1)!.play.mockImplementationOnce(async () => { await pendingPlay.promise })
    return () => {}
  })
  await playTrack('source.mp3', 0.5, 'source')
  changeEqualizer(enabled)
  const audio = audios.at(-1)!
  audio.currentTime = 12
  playOrPause(false)
  response.resolve(new Response('media'))
  await vi.waitFor(() => { expect(audio.src).toBe('blob:local') })
  pendingPlay.reject(new Error('Aborted by source reload'))
  await pendingPlay.promise.catch(() => {})
  audio.dispatchEvent(new Event('loadedmetadata'))
  await Promise.resolve()
  expect(audio.currentTime).toBe(12)
  expect(audio.play).toHaveBeenCalledOnce()
  expect(messages.mock.calls.some(([message]) => message.type === 'audio-player-error')).toBe(false)
})

it('bounds a direct download by time while leaving native playback untouched', async () => {
  const player = await setup()
  vi.useFakeTimers()
  vi.stubGlobal('fetch', vi.fn(async (_url: string, options: RequestInit) => await new Promise<Response>((_resolve, reject) => {
    options.signal?.addEventListener('abort', () => { reject(new Error('Aborted')) })
  })))
  player.audio.src = 'source.mp3'
  player.setEqualizerSource(player.audio, 'source.mp3', false, player.play)
  await vi.advanceTimersByTimeAsync(15000)
  expect(player.browser.snapshot().equalizerStatus).toBe('unavailable')
  expect(player.audio.src).toBe('source.mp3')
  expect(Context.instances).toHaveLength(0)
})

it('rejects an oversized stream and releases its reader without replacing native audio', async () => {
  const player = await setup()
  const cancel = vi.fn()
  vi.stubGlobal('fetch', vi.fn(async () => new Response(new ReadableStream({
    start (controller) { controller.enqueue(new Uint8Array(32 * 1024 * 1024 + 1)) },
    cancel
  }))))
  player.audio.src = 'source.mp3'
  player.setEqualizerSource(player.audio, 'source.mp3', false, player.play)
  await vi.waitFor(() => { expect(player.browser.snapshot().equalizerStatus).toBe('unavailable') })
  expect(cancel).toHaveBeenCalledOnce()
  expect(player.audio.src).toBe('source.mp3')
})

it.each([false, true])('starts once after preparation and respects pending pause/resume=%s without reloading', async resumed => {
  const browser = createChrome()
  const audios = installAudio()
  Context.instances = []
  vi.stubGlobal('AudioContext', Context)
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"offscreen-document-support":true}')))
  const { commonUtils } = await import('@vk-audiopad/common')
  await commonUtils.offscreenDocumentSupport()
  const messages = vi.fn()
  browser.api.runtime.onMessage.addListener(messages)
  const response = deferred<Response>()
  const fetcher = vi.fn(async () => await response.promise)
  vi.stubGlobal('fetch', fetcher)
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:prepared')
  const { changeEqualizer } = await import('../../packages/offscreen/src/equalizer')
  const { playTrack } = await import('../../packages/offscreen/src/handlers/play-track')
  const { playOrPause } = await import('../../packages/offscreen/src/handlers/play-or-pause')
  changeEqualizer(enabled)
  const started = playTrack('source.mp3', 0.5, 'source')
  await vi.waitFor(() => { expect(fetcher).toHaveBeenCalledOnce() })
  const audio = audios.at(-1)!
  expect(audio.src).toBe('')
  expect(audio.play).not.toHaveBeenCalled()
  playOrPause(false)
  if (resumed) playOrPause(true)
  expect(messages.mock.calls.some(([message]) => message.type === 'reload-track')).toBe(false)
  response.resolve(new Response('media'))
  await started
  expect(audio.src).toBe('blob:prepared')
  expect(audio.play).toHaveBeenCalledTimes(resumed ? 1 : 0)
  audio.dispatchEvent(new Event('loadedmetadata'))
  expect(audio.play).toHaveBeenCalledTimes(resumed ? 1 : 0)
  expect(audios).toHaveLength(2)
})

it('does not resume the local source before the processing graph is ready', async () => {
  createChrome()
  const audios = installAudio()
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"offscreen-document-support":true}')))
  const { commonUtils } = await import('@vk-audiopad/common')
  await commonUtils.offscreenDocumentSupport()
  const ready = deferred<void>()
  vi.stubGlobal('AudioContext', class extends Context { resume = vi.fn(async () => { await ready.promise }) })
  vi.stubGlobal('fetch', vi.fn(async () => new Response('media')))
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:prepared')
  const { changeEqualizer } = await import('../../packages/offscreen/src/equalizer')
  const { playTrack } = await import('../../packages/offscreen/src/handlers/play-track')
  const { playOrPause } = await import('../../packages/offscreen/src/handlers/play-or-pause')
  changeEqualizer(enabled)
  const started = playTrack('source.mp3', 0.5, 'source')
  await vi.waitFor(() => { expect(audios.at(-1)!.src).toBe('blob:prepared') })
  playOrPause(false)
  playOrPause(true)
  expect(audios.at(-1)!.play).not.toHaveBeenCalled()
  ready.resolve()
  await started
  expect(audios.at(-1)!.play).toHaveBeenCalledOnce()
})

it('never starts an obsolete source after a preparation ignoring cancellation finishes', async () => {
  createChrome()
  const audios = installAudio()
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"offscreen-document-support":true}')))
  const { commonUtils } = await import('@vk-audiopad/common')
  await commonUtils.offscreenDocumentSupport()
  const response = deferred<Response>()
  const fetcher = vi.fn(async () => await response.promise)
  vi.stubGlobal('fetch', fetcher)
  const { changeEqualizer } = await import('../../packages/offscreen/src/equalizer')
  const { playTrack } = await import('../../packages/offscreen/src/handlers/play-track')
  changeEqualizer(enabled)
  const old = playTrack('old.mp3', 0.5, 'old')
  await vi.waitFor(() => { expect(fetcher).toHaveBeenCalledOnce() })
  const oldAudio = audios.at(-1)!
  changeEqualizer({ enabled: false })
  await playTrack('new.mp3', 0.5, 'new')
  response.resolve(new Response('old media'))
  await old
  expect(oldAudio.src).toBe('')
  expect(oldAudio.play).not.toHaveBeenCalled()
  expect(audios.at(-1)!.src).toBe('new.mp3')
  expect(audios.at(-1)!.play).toHaveBeenCalledOnce()
})

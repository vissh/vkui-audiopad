import { afterEach, expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { installAudio } from '../helpers/audio'
import { deferred } from '../helpers/deferred'

afterEach(() => { vi.doUnmock('hls.js') })

const setup = async () => {
  const browser = createChrome()
  const received = vi.fn()
  browser.api.runtime.onMessage.addListener(message => received(message))
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"offscreen-document-support":true}')))
  const { startListeningPlayerEvents } = await import('../../packages/offscreen/src/listeners/player-events')
  startListeningPlayerEvents()
  const { playTrack } = await import('../../packages/offscreen/src/handlers/play-track')
  return { playTrack, received }
}

it('detaches old audio listeners so late events cannot be attributed to a new track', async () => {
  const audios = installAudio()
  const { playTrack, received } = await setup()
  await playTrack('first.mp3', 0.5, 'first')
  const previous = audios[1]
  await playTrack('second.mp3', 0.8, 'second')
  await vi.waitFor(() => { expect(received).toHaveBeenCalledWith(expect.objectContaining({ playbackId: 'second' })) })
  received.mockClear()
  previous.dispatchEvent(new Event('ended'))
  previous.dispatchEvent(new Event('error'))
  previous.dispatchEvent(new Event('timeupdate'))
  audios[2].dispatchEvent(new Event('error'))
  await vi.waitFor(() => { expect(received).toHaveBeenCalledOnce() })
  expect(received).toHaveBeenCalledWith({ target: 'service-worker', type: 'audio-player-error', playbackId: 'second' })
  expect(previous.paused).toBe(true)
  expect(previous.src).toBe('')
  expect(audios[2].volume).toBe(0.8)
  expect(audios[2].crossOrigin).toBeNull()
})

it('reports a rejected play promise once even if the media also emits error', async () => {
  const audios = installAudio(audio => { audio.play.mockRejectedValueOnce(new Error('Playback denied')) })
  const { playTrack, received } = await setup()
  await playTrack('first.mp3', 0.5, 'first')
  audios[1].dispatchEvent(new Event('error'))
  await vi.waitFor(() => { expect(received).toHaveBeenCalledOnce() })
  expect(received).toHaveBeenCalledWith({ target: 'service-worker', type: 'audio-player-error', playbackId: 'first' })
})

it('ignores delayed HLS callbacks after destroying a previous player', async () => {
  const instances: FakeHls[] = []
  class FakeHls {
    static Events = { MEDIA_ATTACHED: 'attached', ERROR: 'error' }
    handlers = new Map<string, (...args: unknown[]) => void>()
    on (name: string, handler: (...args: unknown[]) => void) { this.handlers.set(name, handler) }
    loadSource = vi.fn()
    attachMedia = vi.fn(() => { this.handlers.get('attached')?.() })
    stopLoad = vi.fn()
    detachMedia = vi.fn()
    destroy = vi.fn()
    constructor () { instances.push(this) }
  }
  vi.doMock('hls.js', () => ({ default: FakeHls }))
  const audios = installAudio()
  const { playTrack, received } = await setup()
  await playTrack('https://audio.invalid/index.m3u8', 0.5, 'hls')
  await playTrack('second.mp3', 0.5, 'second')
  await vi.waitFor(() => { expect(received).toHaveBeenCalledWith(expect.objectContaining({ playbackId: 'second' })) })
  received.mockClear()
  instances[0].handlers.get('attached')?.()
  instances[0].handlers.get('error')?.('error', { fatal: true })
  await Promise.resolve()
  expect(received).not.toHaveBeenCalled()
  expect(audios[1].play).toHaveBeenCalledOnce()
  expect(instances[0].destroy).toHaveBeenCalledOnce()
  const { destroyPlayer } = await import('../../packages/offscreen/src/handlers/play-track')
  destroyPlayer()
  audios[2].dispatchEvent(new Event('ended'))
  audios[2].dispatchEvent(new Event('error'))
  await Promise.resolve()
  expect(received).not.toHaveBeenCalled()
})

it('does not start a pending HLS attachment after an explicit pause', async () => {
  let attach: (() => void) | undefined
  class FakeHls {
    static Events = { MEDIA_ATTACHED: 'attached', ERROR: 'error' }
    on (name: string, handler: () => void) { if (name === 'attached') attach = handler }
    loadSource = vi.fn()
    attachMedia = vi.fn()
    stopLoad = vi.fn()
    detachMedia = vi.fn()
    destroy = vi.fn()
  }
  vi.doMock('hls.js', () => ({ default: FakeHls }))
  const audios = installAudio()
  const { playTrack } = await setup()
  await playTrack('https://audio.invalid/index.m3u8', 0.5, 'hls')
  const { playOrPause } = await import('../../packages/offscreen/src/handlers/play-or-pause')
  playOrPause(false)
  attach?.()
  expect(audios.at(-1)!.play).not.toHaveBeenCalled()
})

it('ignores a rejected older play promise after pause and successful resume of the same source', async () => {
  const pending = deferred<void>()
  const audios = installAudio(audio => { audio.play.mockImplementationOnce(async () => { await pending.promise }) })
  const { playTrack, received } = await setup()
  await playTrack('source.mp3', 0.5, 'media')
  const { playOrPause } = await import('../../packages/offscreen/src/handlers/play-or-pause')
  playOrPause(false)
  playOrPause(true)
  await vi.waitFor(() => { expect(received).toHaveBeenCalledWith(expect.objectContaining({ type: 'audio-player-playing' })) })
  received.mockClear()
  pending.reject(new Error('Old play was aborted by pause'))
  await pending.promise.catch(() => {})
  await Promise.resolve()
  expect(received).not.toHaveBeenCalled()
  expect(audios.at(-1)!.play).toHaveBeenCalledTimes(2)
})

it('reports failure of the current resume attempt', async () => {
  const audios = installAudio()
  const { playTrack, received } = await setup()
  await playTrack('source.mp3', 0.5, 'media')
  await vi.waitFor(() => { expect(received).toHaveBeenCalledWith(expect.objectContaining({ type: 'audio-player-playing' })) })
  const { playOrPause } = await import('../../packages/offscreen/src/handlers/play-or-pause')
  playOrPause(false)
  await vi.waitFor(() => { expect(received).toHaveBeenCalledWith(expect.objectContaining({ type: 'audio-player-pause' })) })
  received.mockClear()
  audios.at(-1)!.play.mockRejectedValueOnce(new Error('Resume denied'))
  playOrPause(true)
  await vi.waitFor(() => { expect(received).toHaveBeenCalledWith(expect.objectContaining({ type: 'audio-player-error', playbackId: 'media' })) })
})

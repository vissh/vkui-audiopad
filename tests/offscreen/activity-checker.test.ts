import { expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { installAudio } from '../helpers/audio'

const setup = async (offscreen: boolean) => {
  vi.useFakeTimers()
  const browser = createChrome()
  const received = vi.fn()
  browser.api.runtime.onMessage.addListener(received)
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ 'offscreen-document-support': offscreen }))))
  const audios = installAudio()
  const { startActivityChecker } = await import('../../packages/offscreen/src/activity-checker')
  startActivityChecker()
  const { replaceAudio, setAudioPlaybackRequested } = await import('../../packages/offscreen/src/audio-element')
  replaceAudio('media')
  setAudioPlaybackRequested(false)
  const audio = audios.at(-1)!
  audio.src = 'https://audio.invalid/source.mp3'
  return { browser, received, audio }
}

it('requests idle cleanup without destroying the source before SW approval', async () => {
  const { received, audio } = await setup(true)
  await vi.advanceTimersByTimeAsync(6 * 60 * 1000)
  expect(received).toHaveBeenCalledWith(expect.objectContaining({ type: 'close-offscreen-document' }))
  expect(audio.src).toBe('https://audio.invalid/source.mp3')
})

it('does not destroy or close unpaused media when timeupdate events stop arriving', async () => {
  const { received, audio } = await setup(true)
  audio.paused = false
  await vi.advanceTimersByTimeAsync(6 * 60 * 1000)
  expect(received).not.toHaveBeenCalled()
  expect(audio.src).toBe('https://audio.invalid/source.mp3')
})

it('never reclaims the Firefox background document', async () => {
  const { received, audio } = await setup(false)
  await vi.advanceTimersByTimeAsync(6 * 60 * 1000)
  expect(received).not.toHaveBeenCalled()
  expect(audio.src).toBe('https://audio.invalid/source.mp3')
})

it('retains a pending source whose Audio has not started yet', async () => {
  const { received, audio } = await setup(true)
  const { setAudioPlaybackRequested } = await import('../../packages/offscreen/src/audio-element')
  setAudioPlaybackRequested(true)
  await vi.advanceTimersByTimeAsync(6 * 60 * 1000)
  expect(received).not.toHaveBeenCalled()
  expect(audio.src).toBe('https://audio.invalid/source.mp3')
})

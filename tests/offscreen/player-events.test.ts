import { expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { installAudio } from '../helpers/audio'

it('reports media errors as ERROR and natural completion as ENDED', async () => {
  const browser = createChrome()
  browser.api.runtime.onMessage.addListener(() => {})
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ 'offscreen-document-support': true }))))
  const audios = installAudio()
  const { startListeningPlayerEvents } = await import('../../packages/offscreen/src/listeners/player-events')
  const { replaceAudio } = await import('../../packages/offscreen/src/audio-element')
  const { commonTypes } = await import('@vk-audiopad/common')
  startListeningPlayerEvents()
  replaceAudio('test-playback')
  const audio = audios[1]
  expect(audio.crossOrigin).toBeNull()
  audio.dispatchEvent(new Event('error'))
  await vi.waitFor(() => { expect(browser.api.runtime.sendMessage).toHaveBeenCalledOnce() })
  expect(browser.api.runtime.sendMessage).toHaveBeenLastCalledWith({
    target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.AUDIO_PLAYER_ERROR, playbackId: 'test-playback'
  })
  audio.dispatchEvent(new Event('ended'))
  await vi.waitFor(() => { expect(browser.api.runtime.sendMessage).toHaveBeenCalledTimes(2) })
  expect(browser.api.runtime.sendMessage).toHaveBeenLastCalledWith({
    target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.AUDIO_PLAYER_ENDED, playbackId: 'test-playback'
  })
})

it('propagates a failed delivery to the message caller', async () => {
  createChrome()
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ 'offscreen-document-support': true }))))
  const { sendMessage } = await import('../../packages/offscreen/src/send-message')
  const { commonTypes } = await import('@vk-audiopad/common')
  await expect(sendMessage({
    target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.AUDIO_PLAYER_ERROR, playbackId: 'test-playback'
  })).rejects.toThrow('Receiving end does not exist')
})

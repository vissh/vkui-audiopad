// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'

it.each([true, false])('delivers the same event with offscreen-document-support=%s', async offscreenSupport => {
  const browser = createChrome()
  document.body.replaceChildren(Object.assign(document.createElement('div'), { id: 'custom-events' }))
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ 'offscreen-document-support': offscreenSupport }))))
  const { commonTypes, commonUtils } = await import('@vk-audiopad/common')
  const { sendMessage } = await import('../../packages/offscreen/src/send-message')
  const received = vi.fn()
  if (offscreenSupport) {
    browser.api.runtime.onMessage.addListener(message => received(message))
  } else {
    commonUtils.addBackgroundMessageListener(received)
  }
  const message = { target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.AUDIO_PLAYER_ERROR, playbackId: 'test-playback' } as const
  await sendMessage(message)
  expect(received).toHaveBeenCalledOnce()
  expect(received).toHaveBeenCalledWith(message)
  expect(browser.api.runtime.sendMessage).toHaveBeenCalledTimes(offscreenSupport ? 1 : 0)
})

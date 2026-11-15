// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { installAudio } from '../helpers/audio'

it.each([false, true])('applies validated audio commands and replies through background=%s', async background => {
  const browser = createChrome()
  installAudio()
  document.body.replaceChildren(Object.assign(document.createElement('div'), { id: 'custom-events' }))
  const { startListeningMessages } = await import('../../packages/offscreen/src/listeners/messages')
  startListeningMessages()
  const { commandClient, commonTypes } = await import('@vk-audiopad/common')
  const { audioElement } = await import('../../packages/offscreen/src/audio-element')
  expect(await commandClient.requestCommand({ target: commonTypes.MessageTarget.OFFSCREEN, type: commonTypes.MessageType.CHANGE_VOLUME, value: 0.7 }, background)).toMatchObject({ ok: true, outcome: 'handled' })
  expect(audioElement.volume).toBe(0.7)
  await browser.api.runtime.sendMessage(null)
  const invalid = { target: commonTypes.MessageTarget.OFFSCREEN, type: commonTypes.MessageType.CHANGE_VOLUME, value: 3, requestId: 'invalid', expiresAt: Date.now() + 1000 }
  expect(await browser.api.runtime.sendMessage(invalid)).toMatchObject({ ok: false })
  expect(audioElement.volume).toBe(0.7)
})

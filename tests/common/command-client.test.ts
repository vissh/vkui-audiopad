// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'

it.each([undefined, null, { requestId: 'wrong', ok: true, outcome: 'handled' }, { requestId: 'wrong', ok: true, outcome: 'invented' }])('rejects malformed or unrelated runtime result %# without replay', async response => {
  const browser = createChrome()
  browser.api.runtime.sendMessage.mockResolvedValueOnce(response)
  const { commandClient, commonTypes } = await import('@vk-audiopad/common')
  const reply = await commandClient.requestCommand({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.REPEAT })
  expect(reply).toMatchObject({ ok: false })
  expect(browser.api.runtime.sendMessage).toHaveBeenCalledOnce()
})

it.each([false, true])('bounds a missing reply and cleans background listeners with bridge=%s', async background => {
  vi.useFakeTimers()
  const browser = createChrome()
  document.body.replaceChildren(Object.assign(document.createElement('div'), { id: 'custom-events' }))
  const bridge = document.getElementById('custom-events')!
  const added = vi.spyOn(bridge, 'addEventListener')
  const removed = vi.spyOn(bridge, 'removeEventListener')
  browser.api.runtime.sendMessage.mockImplementationOnce(async () => await new Promise(() => {}))
  const { commandClient, commonTypes } = await import('@vk-audiopad/common')
  const reply = commandClient.requestCommand({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.REPEAT }, background)
  bridge.dispatchEvent(new CustomEvent(commonTypes.MessageType.COMMAND_REPLY, { detail: null }))
  await vi.advanceTimersByTimeAsync(commandClient.TIMEOUT_MS)
  expect(await reply).toMatchObject({ ok: false })
  if (background) expect(removed.mock.calls).toEqual(added.mock.calls)
  expect(vi.getTimerCount()).toBe(0)
})

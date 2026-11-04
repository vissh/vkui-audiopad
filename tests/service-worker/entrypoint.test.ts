import { expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { deferred } from '../helpers/deferred'

it('registers the actual Chrome entrypoint listeners while storage initialization is still pending', async () => {
  const browser = createChrome({ played: true, playbackId: 'stale-media' })
  const release = deferred<void>()
  const read = browser.api.storage.local.get.getMockImplementation()!
  browser.api.storage.local.get.mockImplementationOnce(async (keys, callback) => {
    await release.promise
    return await read(keys, callback)
  })
  await import('../../packages/service-worker/src/index')
  expect(browser.api.runtime.onMessage.addListener).toHaveBeenCalledOnce()
  expect(browser.api.commands.onCommand.addListener).toHaveBeenCalledOnce()
  expect(browser.api.runtime.onInstalled.addListener).toHaveBeenCalledOnce()
  expect(browser.snapshot()).toMatchObject({ playbackInitialization: 'loading', played: true })
  expect(browser.api.runtime.getContexts).not.toHaveBeenCalled()
  release.resolve()
  await vi.waitFor(() => { expect(browser.snapshot()).toMatchObject({ playbackInitialization: 'ready', played: false, playbackId: null }) })
})

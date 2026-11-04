import { expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { deferred } from '../helpers/deferred'

it('shares an in-flight offscreen creation and reuses the existing document', async () => {
  const browser = createChrome()
  const pending = deferred<void>()
  const create = browser.api.offscreen.createDocument.getMockImplementation()!
  browser.api.offscreen.createDocument.mockImplementationOnce(async options => { await pending.promise; await create(options) })
  const { setupOffscreenDocument } = await import('../../packages/service-worker/src/offscreen/setup')
  const first = setupOffscreenDocument()
  const second = setupOffscreenDocument()
  await vi.waitFor(() => { expect(browser.api.offscreen.createDocument).toHaveBeenCalledOnce() })
  pending.resolve()
  await Promise.all([first, second])
  browser.api.runtime.getContexts.mockResolvedValueOnce([{ documentUrl: 'offscreen.html' }])
  await setupOffscreenDocument()
  expect(browser.api.offscreen.createDocument).toHaveBeenCalledOnce()
})

it('allows a new creation attempt after a rejected request', async () => {
  const browser = createChrome()
  browser.api.offscreen.createDocument.mockRejectedValueOnce(new Error('Creation denied'))
  const { setupOffscreenDocument } = await import('../../packages/service-worker/src/offscreen/setup')
  await expect(setupOffscreenDocument()).rejects.toThrow('Creation denied')
  await expect(setupOffscreenDocument()).resolves.toBeUndefined()
  expect(browser.api.offscreen.createDocument).toHaveBeenCalledTimes(2)
})

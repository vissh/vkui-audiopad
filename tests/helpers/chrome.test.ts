import { expect, it, vi } from 'vitest'
import { createChrome } from './chrome'

it('delivers cloned storage changes asynchronously and supports both storage APIs', async () => {
  const browser = createChrome()
  const changed = vi.fn()
  browser.api.storage.local.onChanged.addListener(changed)
  const payload = { queue: ['A'] }
  const write = browser.api.storage.local.set(payload)
  payload.queue.push('B')
  expect(browser.snapshot()).toEqual({})
  expect(changed).not.toHaveBeenCalled()
  await write
  expect(changed).toHaveBeenCalledWith({ queue: { newValue: ['A'] } }, 'local')
  const read = await browser.api.storage.local.get('queue')
  ;(read.queue as string[]).push('C')
  const callback = vi.fn()
  await browser.api.storage.local.get(callback)
  expect(callback).toHaveBeenCalledWith({ queue: ['A'] })
  await browser.api.storage.local.remove('queue')
  expect(changed).toHaveBeenLastCalledWith({ queue: { oldValue: ['A'] } }, 'local')
})

it('rejects failed promise operations and exposes lastError only inside a failed callback', async () => {
  const browser = createChrome({ volume: 0.5 })
  browser.failNextStorageOperation('Quota exceeded')
  await expect(browser.api.storage.local.set({ volume: 1 })).rejects.toThrow('Quota exceeded')
  expect(browser.snapshot()).toEqual({ volume: 0.5 })
  browser.failNextStorageOperation('Storage unavailable')
  const callback = vi.fn(() => {
    expect(browser.api.runtime.lastError?.message).toBe('Storage unavailable')
  })
  await browser.api.storage.local.get('volume', callback)
  expect(callback).toHaveBeenCalledOnce()
  expect(browser.api.runtime.lastError).toBeUndefined()
  expect(await browser.api.storage.local.get('volume')).toEqual({ volume: 0.5 })
})

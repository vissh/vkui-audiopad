import { expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { deferred } from '../helpers/deferred'

it('restores stored playback controls and observes cross-context updates and removal', async () => {
  const browser = createChrome({ volume: 0.5, played: false })
  const { storage } = await import('../../packages/service-worker/src/storage')
  expect(await storage.load()).toEqual({ volume: 0.5, played: false })
  const observed = vi.fn()
  storage.volume.listen(observed)
  await browser.api.storage.local.set({ volume: 0.8 })
  expect(observed).toHaveBeenLastCalledWith(0.8)
  expect(await storage.volume.get()).toBe(0.8)
  await browser.api.storage.local.remove('volume')
  expect(observed).toHaveBeenLastCalledWith(undefined)
})

it('commits a multi-key update and notifies state consumers', async () => {
  const browser = createChrome()
  const { storage } = await import('../../packages/service-worker/src/storage')
  const observed = vi.fn()
  storage.listen(observed)
  await storage.set({ played: true, currentTime: 12 })
  expect(browser.snapshot()).toEqual({ played: true, currentTime: 12 })
  expect(observed).toHaveBeenCalledWith({ played: true, currentTime: 12 })
})

it.each([{}, { played: true }, { played: true, playbackRequested: true }])('loads stored state %j without guessing the actual media state', async saved => {
  const browser = createChrome(saved)
  const { loadState, applicationState } = await import('../../packages/service-worker/src/state')
  await loadState()
  expect(applicationState.played).toBe('played' in saved ? saved.played : false)
  expect(browser.snapshot()).toEqual(saved)
  expect(browser.api.storage.local.set).not.toHaveBeenCalled()
})

it('merges changes and removals arriving after a startup read took its snapshot', async () => {
  const browser = createChrome({ volume: 0.3, currentPlaylist: { id: 'old' } })
  const read = browser.api.storage.local.get.getMockImplementation()!
  const taken = deferred<void>()
  const release = deferred<void>()
  browser.api.storage.local.get.mockImplementationOnce(async (keys, callback) => {
    const result = await read(keys, callback)
    taken.resolve()
    await release.promise
    return result
  })
  const { loadState, applicationState } = await import('../../packages/service-worker/src/state')
  const loading = loadState()
  await taken.promise
  await browser.api.storage.local.set({ volume: 0.8 })
  await browser.api.storage.local.remove('currentPlaylist')
  release.resolve()
  await loading
  expect(applicationState.volume).toBe(0.8)
  expect(applicationState.currentPlaylist).toBeNull()
})

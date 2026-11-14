// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { playlist } from '../helpers/playback'

afterEach(() => { cleanup() })

it('hydrates a React subscriber and synchronizes local and external storage changes', async () => {
  const browser = createChrome({ volume: 0.4 })
  const { storageAtom, useAtom } = await import('@/shared/lib/atom')
  const volume = storageAtom({ key: 'volume', initial: 0, compareObjects: false })
  const { result, unmount } = renderHook(() => useAtom(volume))
  await act(async () => { await browser.api.storage.local.get('volume') })
  expect(result.current[0]).toBe(0.4)
  await act(async () => { await browser.api.storage.local.set({ volume: 0.9 }) })
  expect(result.current[0]).toBe(0.9)
  act(() => { result.current[1](0.2) })
  await act(async () => { await browser.api.storage.local.get('volume') })
  expect(browser.snapshot().volume).toBe(0.2)
  await act(async () => { await browser.api.storage.local.remove('volume') })
  expect(result.current[0]).toBe(0)
  unmount()
})

it('unsubscribes a React listener after unmount', async () => {
  createChrome()
  const { atom, useAtomValue } = await import('@/shared/lib/atom')
  const state = atom(0)
  let renders = 0
  const { result, unmount } = renderHook(() => {
    renders++
    return useAtomValue(state)
  })
  act(() => { state.set(1) })
  expect(result.current).toBe(1)
  unmount()
  const before = renders
  state.set(2)
  expect(renders).toBe(before)
})

it('observes playlist order changes when identity and length stay unchanged', async () => {
  const browser = createChrome({ currentPlaylist: playlist(['A', 'B']) })
  const { useCurrentPlaylist } = await import('@/entities/active-track')
  const { result } = renderHook(useCurrentPlaylist)
  await act(async () => { await browser.api.storage.local.get() })
  await act(async () => { await browser.api.storage.local.set({ currentPlaylist: playlist(['B', 'A']) }) })
  expect(result.current?.tracks.map(track => track.id)).toEqual(['B', 'A'])
})

it('hydrates concurrently created atoms with one key-limited read and reads later atoms afresh', async () => {
  const browser = createChrome({ volume: 0.4, repeat: 2, privateUnused: 'not requested' })
  const { storageAtom } = await import('@/shared/lib/atom')
  const volume = storageAtom({ key: 'volume', initial: 0, compareObjects: false })
  const repeat = storageAtom({ key: 'repeat', initial: 0, compareObjects: false })
  await vi.waitFor(() => { expect(volume.get()).toBe(0.4) })
  expect(repeat.get()).toBe(2)
  expect(browser.api.storage.local.get).toHaveBeenCalledExactlyOnceWith(['volume', 'repeat'], expect.any(Function))
  await browser.api.storage.local.set({ repeat: 1 })
  const later = storageAtom({ key: 'repeat', initial: 0, compareObjects: false })
  await vi.waitFor(() => { expect(later.get()).toBe(1) })
  expect(browser.api.storage.local.get).toHaveBeenCalledTimes(2)
})

it.each(['local', 'external', 'removal'] as const)('keeps a newer %s update when an initial storage snapshot arrives late', async kind => {
  const browser = createChrome({ volume: 0.4 })
  let complete: ((items: Record<string, unknown>) => void) | undefined
  browser.api.storage.local.get.mockImplementationOnce(async (_keys, callback) => { complete = callback; return { volume: 0.4 } })
  const { storageAtom } = await import('@/shared/lib/atom')
  const ready = vi.fn()
  const volume = storageAtom({ key: 'volume', initial: 0, compareObjects: false, onReady: ready })
  await vi.waitFor(() => { expect(complete).toBeDefined() })
  if (kind === 'local') volume.set(0.9)
  else if (kind === 'external') await browser.api.storage.local.set({ volume: 0.9 })
  else await browser.api.storage.local.remove('volume')
  await browser.api.storage.local.get()
  complete!({ volume: 0.4 })
  expect(volume.get()).toBe(kind === 'removal' ? 0 : 0.9)
  expect(ready).toHaveBeenCalledOnce()
})

it('flushes startup reads before rendering without scheduling an extra empty read', async () => {
  const browser = createChrome({ volume: 0.4, repeat: 2 })
  const { storageAtom, flushStorageReads } = await import('@/shared/lib/atom')
  storageAtom({ key: 'volume', initial: 0, compareObjects: false })
  storageAtom({ key: 'repeat', initial: 0, compareObjects: false })
  flushStorageReads()
  expect(browser.api.storage.local.get).toHaveBeenCalledExactlyOnceWith(['volume', 'repeat'], expect.any(Function))
  await Promise.resolve()
  expect(browser.api.storage.local.get).toHaveBeenCalledOnce()
})

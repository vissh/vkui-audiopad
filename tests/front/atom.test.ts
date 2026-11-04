// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
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

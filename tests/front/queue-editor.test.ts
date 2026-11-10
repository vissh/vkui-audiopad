// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { commonTypes } from '@vk-audiopad/common'
import { createChrome } from '../helpers/chrome'
import { playlist, track } from '../helpers/playback'

beforeEach(() => {
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
})

afterEach(() => {
  cleanup()
  for (const path of ['@/widgets/navigation', '@/widgets/track-list', '@/shared/ui/infinity-content', '@/shared/api', '../../packages/front/src/pages/current-playlist/ui/EditableTrack']) vi.doUnmock(path)
})

const queryWrapper = async () => {
  const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query')
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client, children })
}

const editor = async (queue = playlist(['A', 'B', 'C'])) => {
  const browser = createChrome({ currentPlaylist: queue })
  const commands = vi.fn()
  browser.api.runtime.onMessage.addListener(message => commands(message))
  vi.doMock('@/widgets/navigation', () => ({ Navigation: () => null }))
  vi.doMock('@/widgets/track-list', () => ({ Track: ({ track }: { track: commonTypes.TrackItem }) => createElement('span', { 'data-testid': 'track' }, track.id, createElement('input', { 'aria-label': 'Draft ' + track.id, defaultValue: '' })) }))
  vi.doMock('@/shared/ui/infinity-content', () => ({ InfinityContent: ({ children, hasMore }: { children: ReactNode, hasMore: boolean }) => createElement('div', { 'data-testid': 'pagination', 'data-has-more': hasMore }, children) }))
  vi.doMock('@/shared/api', () => ({ fetchMorePlaylistTracks: vi.fn() }))
  vi.doMock('../../packages/front/src/pages/current-playlist/ui/EditableTrack', () => ({
    EditableTrack: ({ track, trackIndex, onRemove, onDragFinish }: { track: commonTypes.TrackItem, trackIndex: number, onRemove: (index: number) => void, onDragFinish: (args: { from: number, to: number }) => void }) => createElement('div', {},
      createElement('button', { onClick: () => { onRemove(trackIndex) } }, `Remove ${track.id}`),
      createElement('button', { onClick: () => { onDragFinish({ from: trackIndex, to: 0 }) } }, `Move ${track.id}`))
  }))
  const { ConfigProvider, AdaptivityProvider, Platform } = await import('@vkontakte/vkui')
  const { CurrentPlaylist } = await import('../../packages/front/src/pages/current-playlist/ui/CurrentPlaylist')
  const Query = await queryWrapper()
  const tree = (active: boolean) => createElement(Query, { children: createElement(ConfigProvider, { platform: Platform.ANDROID, children: createElement(AdaptivityProvider, { children: createElement(CurrentPlaylist, { active }) }) }) })
  const view = render(tree(true))
  await act(async () => { await browser.api.storage.local.get() })
  return { ...browser, queue, commands, view, setActive: (active: boolean) => { view.rerender(tree(active)) } }
}

it('sends an edit command and renders the worker snapshot instead of writing playlist state', async () => {
  const browser = await editor()
  fireEvent.click(screen.getByRole('button', { name: 'Режим редактирования' }))
  fireEvent.click(screen.getByRole('button', { name: 'Move B' }))
  fireEvent.click(screen.getByRole('button', { name: 'Применить' }))
  expect(browser.commands).toHaveBeenCalledExactlyOnceWith({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.EDIT_CURRENT_PLAYLIST, oldPlaylist: browser.queue, playlist: playlist(['B', 'A', 'C']), actions: [['move', 1, 0]] })
  expect(browser.api.storage.local.set).not.toHaveBeenCalled()
  expect(screen.getAllByTestId('track').map(item => item.textContent)).toEqual(['A', 'B', 'C'])
  await act(async () => { await browser.api.storage.local.set({ currentPlaylist: playlist(['B', 'A', 'C']) }) })
  expect(screen.getAllByTestId('track').map(item => item.textContent)).toEqual(['B', 'A', 'C'])
})

it('cancels a draft when a newer queue arrives and discards its stale actions', async () => {
  const browser = await editor()
  fireEvent.click(screen.getByRole('button', { name: 'Режим редактирования' }))
  fireEvent.click(screen.getByRole('button', { name: 'Remove B' }))
  await act(async () => { await browser.api.storage.local.set({ currentPlaylist: playlist(['A', 'D', 'B', 'C']) }) })
  expect(screen.queryByRole('button', { name: 'Применить' })).toBeNull()
  expect(screen.getAllByTestId('track').map(item => item.textContent)).toEqual(['A', 'D', 'B', 'C'])
  fireEvent.click(screen.getByRole('button', { name: 'Режим редактирования' }))
  fireEvent.click(screen.getByRole('button', { name: 'Применить' }))
  expect(browser.commands).not.toHaveBeenCalled()
})

it('keeps a rapid sequence of draft edits and its action list consistent', async () => {
  const browser = await editor()
  fireEvent.click(screen.getByRole('button', { name: 'Режим редактирования' }))
  const remove = screen.getByRole('button', { name: 'Remove A' })
  act(() => {
    fireEvent.click(remove)
    fireEvent.click(remove)
  })
  fireEvent.click(screen.getByRole('button', { name: 'Применить' }))
  expect(browser.commands).toHaveBeenCalledWith(expect.objectContaining({ playlist: playlist(['C']), actions: [['remove', 0], ['remove', 0]] }))
})

it('sends a page merge command without mutating its response or writing storage', async () => {
  const base = playlist(['A', 'B'])
  const page = playlist(['C'])
  const browser = createChrome({ currentPlaylist: base })
  const commands = vi.fn()
  browser.api.runtime.onMessage.addListener(message => commands(message))
  vi.doMock('@/shared/api', () => ({ fetchMorePlaylistTracks: vi.fn(async () => ({ playlist: page })) }))
  const { useLoadMorePlaylistTracksMutation } = await import('../../packages/front/src/pages/current-playlist/model/hooks')
  const { result } = renderHook(() => useLoadMorePlaylistTracksMutation(), { wrapper: await queryWrapper() })
  await act(async () => { await result.current.mutateAsync(base) })
  expect(commands).toHaveBeenCalledExactlyOnceWith({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.APPEND_CURRENT_PLAYLIST, basePlaylist: base, playlist: page })
  expect(page.tracks).toEqual([track('C')])
  expect(browser.api.storage.local.set).not.toHaveBeenCalled()
})

it('defers the remaining queue in one transition, keeps focused rows, pauses when inactive and gates metadata paging', async () => {
  const pending = new Map<number, IdleRequestCallback>()
  let id = 0
  vi.stubGlobal('requestIdleCallback', vi.fn((onIdle: IdleRequestCallback) => { pending.set(++id, onIdle); return id }))
  vi.stubGlobal('cancelIdleCallback', vi.fn((id: number) => { pending.delete(id) }))
  const queue = { ...playlist(Array.from({ length: 100 }, (_, index) => '1_' + index)), hasMore: true }
  const browser = await editor(queue)
  const firstCount = screen.getAllByTestId('track').length
  expect(firstCount).toBeGreaterThan(0)
  expect(firstCount).toBeLessThan(queue.tracks.length)
  expect(screen.getByRole('status', { name: 'Загрузка треков' })).not.toBeNull()
  expect(screen.getByTestId('pagination').getAttribute('data-has-more')).toBe('false')
  const input = screen.getByRole('textbox', { name: 'Draft 1_0' })
  fireEvent.change(input, { target: { value: 'Keep me' } })
  input.focus()
  browser.setActive(false)
  expect(pending.size).toBe(0)
  expect(screen.getAllByTestId('track')).toHaveLength(firstCount)
  browser.setActive(true)
  const entry = pending.entries().next().value
  if (entry == null) throw new Error('Missing idle task')
  const [idleId, onIdle] = entry
  pending.delete(idleId)
  await act(async () => { onIdle({ didTimeout: false, timeRemaining: () => 30 }) })
  expect(pending.size).toBe(0)
  expect(screen.getAllByTestId('track').map(item => item.textContent)).toEqual(queue.tracks.map(item => item.id))
  expect(screen.getByRole('textbox', { name: 'Draft 1_0' })).toBe(input)
  expect(document.activeElement).toBe(input)
  expect((input as HTMLInputElement).value).toBe('Keep me')
  expect(screen.queryByRole('status', { name: 'Загрузка треков' })).toBeNull()
  expect(screen.getByTestId('pagination').getAttribute('data-has-more')).toBe('true')
  expect(browser.commands).not.toHaveBeenCalled()
  expect(browser.api.storage.local.set).not.toHaveBeenCalled()
})

it('cancels queued rendering on unmount and supports browsers without idle callbacks', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('requestIdleCallback', undefined)
  const { useProgressiveCount } = await import('@/shared/lib/use-progressive-count')
  const view = renderHook(({ total, active, scope }) => useProgressiveCount(total, active, scope), { initialProps: { total: 100, active: true, scope: 'first' } })
  const first = view.result.current
  await act(async () => { await vi.advanceTimersByTimeAsync(16) })
  expect(view.result.current).toBeGreaterThan(first)
  view.rerender({ total: 3, active: true, scope: 'first' })
  expect(view.result.current).toBe(3)
  expect(vi.getTimerCount()).toBe(0)
  view.rerender({ total: 100, active: false, scope: 'first' })
  expect(vi.getTimerCount()).toBe(0)
  view.rerender({ total: 100, active: true, scope: 'first' })
  expect(vi.getTimerCount()).toBe(1)
  view.rerender({ total: 100, active: true, scope: 'second' })
  expect(view.result.current).toBe(first)
  view.unmount()
  expect(vi.getTimerCount()).toBe(0)
})

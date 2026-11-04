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

const editor = async () => {
  const queue = playlist(['A', 'B', 'C'])
  const browser = createChrome({ currentPlaylist: queue })
  const commands = vi.fn()
  browser.api.runtime.onMessage.addListener(commands)
  vi.doMock('@/widgets/navigation', () => ({ Navigation: () => null }))
  vi.doMock('@/widgets/track-list', () => ({ Track: ({ track }: { track: commonTypes.TrackItem }) => createElement('span', { 'data-testid': 'track' }, track.id) }))
  vi.doMock('@/shared/ui/infinity-content', () => ({ InfinityContent: ({ children }: { children: ReactNode }) => createElement('div', {}, children) }))
  vi.doMock('@/shared/api', () => ({ fetchMorePlaylistTracks: vi.fn() }))
  vi.doMock('../../packages/front/src/pages/current-playlist/ui/EditableTrack', () => ({
    EditableTrack: ({ track, trackIndex, onRemove, onDragFinish }: { track: commonTypes.TrackItem, trackIndex: number, onRemove: (index: number) => void, onDragFinish: (args: { from: number, to: number }) => void }) => createElement('div', {},
      createElement('button', { onClick: () => { onRemove(trackIndex) } }, `Remove ${track.id}`),
      createElement('button', { onClick: () => { onDragFinish({ from: trackIndex, to: 0 }) } }, `Move ${track.id}`))
  }))
  const { ConfigProvider, AdaptivityProvider, Platform } = await import('@vkontakte/vkui')
  const { CurrentPlaylist } = await import('../../packages/front/src/pages/current-playlist/ui/CurrentPlaylist')
  const Query = await queryWrapper()
  render(createElement(Query, { children: createElement(ConfigProvider, { platform: Platform.ANDROID, children: createElement(AdaptivityProvider, { children: createElement(CurrentPlaylist, { active: true }) }) }) }))
  await act(async () => { await browser.api.storage.local.get() })
  return { ...browser, queue, commands }
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
  browser.api.runtime.onMessage.addListener(commands)
  vi.doMock('@/shared/api', () => ({ fetchMorePlaylistTracks: vi.fn(async () => ({ playlist: page })) }))
  const { useLoadMorePlaylistTracksMutation } = await import('../../packages/front/src/pages/current-playlist/model/hooks')
  const { result } = renderHook(() => useLoadMorePlaylistTracksMutation(), { wrapper: await queryWrapper() })
  await act(async () => { await result.current.mutateAsync(base) })
  expect(commands).toHaveBeenCalledExactlyOnceWith({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.APPEND_CURRENT_PLAYLIST, basePlaylist: base, playlist: page })
  expect(page.tracks).toEqual([track('C')])
  expect(browser.api.storage.local.set).not.toHaveBeenCalled()
})

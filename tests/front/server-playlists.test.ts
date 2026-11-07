// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createElement, Fragment, type ReactNode } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { controlledFetch } from '../helpers/fetch'
import { track } from '../helpers/playback'

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe () {} unobserve () {} disconnect () {} })
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
})
afterEach(cleanup)

const session = async () => {
  const browser = createChrome({ userId: '1', webToken: { userId: '1', accessToken: 'synthetic', expires: Number.MAX_SAFE_INTEGER, error: null }, audiosIds: [['1_10', ''], ['-2_20', 'source-key']] })
  const { startSessionService } = await import('../../packages/service-worker/src/session')
  startSessionService()
  vi.resetModules()
  return browser
}
const saved = { id: 10, owner_id: 1, title: 'My playlist', count: 0 }

const mount = async (content: ReactNode) => {
  const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query')
  const { ConfigProvider, AdaptivityProvider, Platform } = await import('@vkontakte/vkui')
  const { PlaylistDialogs } = await import('@/features/manage-playlists')
  const { Notification } = await import('@/shared/ui/notification')
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const ui = render(createElement(QueryClientProvider, { client, children: createElement(ConfigProvider, { platform: Platform.ANDROID, children: createElement(AdaptivityProvider, { children: createElement(Fragment, {}, content, createElement(PlaylistDialogs), createElement(Notification)) }) }) }))
  return { ...ui, client }
}

it('saves the complete queue once, including unloaded IDs, without changing playback storage', async () => {
  const browser = await session()
  const network = controlledFetch()
  const { SaveQueueButton } = await import('@/features/manage-playlists')
  await mount(createElement(SaveQueueButton))
  await waitFor(() => { expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Сохранить как плейлист' }).disabled).toBe(false) })
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить как плейлист' }))
  const title = await screen.findByLabelText('Название')
  fireEvent.change(title, { target: { value: 'Full queue' } })
  fireEvent.change(screen.getByLabelText('Описание'), { target: { value: 'Saved on VK' } })
  const save = screen.getByRole('button', { name: 'Сохранить' })
  save.focus()
  fireEvent.click(save)
  fireEvent.submit(save.closest('form')!)
  await waitFor(() => { expect(network.requests).toHaveLength(1) })
  expect(document.activeElement).toBe(save)
  expect(new URLSearchParams(String(network.requests[0].init?.body)).get('audio_ids')).toBe('1_10,-2_20_source-key')
  await act(async () => { network.requests[0].resolve(Response.json({ response: { ...saved, count: 2 } })) })
  expect(await screen.findByText('Плейлист сохранён в VK')).not.toBeNull()
  expect(browser.api.storage.local.set).not.toHaveBeenCalled()
})

it('adds a track to an existing owned playlist and invalidates account-scoped caches', async () => {
  await session()
  const calls: Array<{ url: string, body: URLSearchParams }> = []
  vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
    calls.push({ url: input, body: new URLSearchParams(String(init?.body)) })
    return Response.json({ response: input.includes('getPlaylists') ? { count: 1, items: [saved] } : [{ audio_id: 20 }] })
  }))
  const { AddTrackToPlaylistButton } = await import('@/features/manage-playlists')
  const { client } = await mount(createElement(AddTrackToPlaylistButton, { track: { ...track('-2_20'), accessKey: 'source-key' } }))
  client.setQueryData(['myMusic', '1'], { value: 'old' })
  client.setQueryData(['myMusic', '2'], { value: 'another account' })
  await screen.findByRole('button', { name: 'Добавить в плейлист' })
  fireEvent.click(screen.getByRole('button', { name: 'Добавить в плейлист' }))
  fireEvent.click(await screen.findByText('My playlist'))
  expect(await screen.findByText('Трек добавлен в плейлист')).not.toBeNull()
  const add = calls.filter(call => call.url.includes('addToPlaylist'))
  expect(add).toHaveLength(1)
  expect(Object.fromEntries(add[0].body)).toMatchObject({ owner_id: '1', playlist_id: '10', audio_ids: '-2_20_source-key' })
  expect(client.getQueryState(['myMusic', '1'])?.isInvalidated).toBe(true)
  expect(client.getQueryState(['myMusic', '2'])?.isInvalidated).toBe(false)
})

it('keeps the form after ambiguous failure, shows safe feedback and does not replay it', async () => {
  await session()
  const network = vi.fn(async () => { throw new Error('synthetic-private-value') })
  vi.stubGlobal('fetch', network)
  const { SaveQueueButton } = await import('@/features/manage-playlists')
  await mount(createElement(SaveQueueButton))
  await waitFor(() => { expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Сохранить как плейлист' }).disabled).toBe(false) })
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить как плейлист' }))
  fireEvent.change(await screen.findByLabelText('Название'), { target: { value: 'Keep this title' } })
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
  expect((await screen.findByRole('alert')).textContent).toContain('Проверьте плейлисты в VK')
  expect(screen.getByLabelText<HTMLInputElement>('Название').value).toBe('Keep this title')
  expect(document.body.textContent).not.toContain('synthetic-private-value')
  expect(network).toHaveBeenCalledOnce()
})

it('creates a playlist containing the selected source track directly from the picker', async () => {
  await session()
  const network = vi.fn(async (input: string, _init?: RequestInit) => Response.json({ response: input.includes('getPlaylists') ? { count: 0, items: [] } : { ...saved, count: 1 } }))
  vi.stubGlobal('fetch', network)
  const { AddTrackToPlaylistButton } = await import('@/features/manage-playlists')
  await mount(createElement(AddTrackToPlaylistButton, { track: track('-2_20') }))
  fireEvent.click(await screen.findByRole('button', { name: 'Добавить в плейлист' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Создать плейлист' }))
  fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'New' } })
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
  await screen.findByText('Плейлист сохранён в VK')
  const creates = network.mock.calls.filter(([input]) => input.includes('createPlaylist'))
  expect(creates).toHaveLength(1)
  expect(new URLSearchParams(String(creates[0][1]?.body)).get('audio_ids')).toBe('-2_20')
})

it('does not publish completion into a retired UI after closing the pending dialog', async () => {
  await session()
  const network = controlledFetch()
  const { SaveQueueButton } = await import('@/features/manage-playlists')
  const { unmount, client } = await mount(createElement(SaveQueueButton))
  fireEvent.click(await screen.findByRole('button', { name: 'Сохранить как плейлист' }))
  fireEvent.change(await screen.findByLabelText('Название'), { target: { value: 'New' } })
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
  await waitFor(() => { expect(network.requests).toHaveLength(1) })
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  unmount()
  await act(async () => { network.requests[0].resolve(Response.json({ response: { ...saved, count: 2 } })) })
  expect(invalidate).not.toHaveBeenCalled()
  const { useNotification } = await import('@/shared/model')
  const { renderHook } = await import('@testing-library/react')
  const notification = renderHook(useNotification)
  expect(notification.result.current).toBeNull()
})

it('cancels and reopens creation with a fresh empty form without issuing a mutation', async () => {
  await session()
  const network = vi.fn()
  vi.stubGlobal('fetch', network)
  const { MyPlaylists } = await import('@/features/manage-playlists')
  await mount(createElement(MyPlaylists, { userId: '1', active: false }))
  await waitFor(() => { expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Создать плейлист' }).disabled).toBe(false) })
  fireEvent.click(screen.getByRole('button', { name: 'Создать плейлист' }))
  fireEvent.change(await screen.findByLabelText('Название'), { target: { value: 'Discarded' } })
  fireEvent.click(screen.getAllByRole('button', { name: 'Отмена' })[1])
  fireEvent.click(screen.getByRole('button', { name: 'Создать плейлист' }))
  await waitFor(() => { expect(screen.getByLabelText<HTMLInputElement>('Название').value).toBe('') })
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Сохранить' }).disabled).toBe(true)
  expect(network).not.toHaveBeenCalled()
})

it('offers an explicit playlist-list retry after failure without automatically repeating requests', async () => {
  await session()
  const network = vi.fn(async () => Response.json({ response: { count: 1, items: [saved] } }))
  network.mockRejectedValueOnce(new Error('synthetic-private-value'))
  vi.stubGlobal('fetch', network)
  const { MyPlaylists } = await import('@/features/manage-playlists')
  await mount(createElement(MyPlaylists, { userId: '1', active: true }))
  const retry = await screen.findByRole('button', { name: 'Повторить' })
  expect(network).toHaveBeenCalledOnce()
  fireEvent.click(retry)
  expect(await screen.findByText('My playlist')).not.toBeNull()
  expect(network).toHaveBeenCalledTimes(2)
  expect(document.body.textContent).not.toContain('synthetic-private-value')
})

it('opens a saved empty server playlist with its title and a useful empty state', async () => {
  await session()
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ payload: [0, [{ id: '10', ownerId: '1', title: 'Empty playlist', list: [], hasMore: false, nextOffset: '' }]] })))
  const { PlaylistTracks } = await import('@/pages/playlist-tracks')
  const { vkPlaylists } = await import('@vk-audiopad/common')
  const source = vkPlaylists.toPlaybackPlaylist({ id: '10', ownerId: '1', title: 'Empty playlist', description: '', count: 0, accessKey: '' })
  await mount(createElement(PlaylistTracks, { userId: '1', fromId: '1', playlist: source }))
  expect(await screen.findByText(/В плейлисте пока нет треков/)).not.toBeNull()
  expect(screen.getByRole('heading', { name: 'Empty playlist' })).not.toBeNull()
})

// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createElement, Fragment, type ReactNode } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { type commonTypes } from '@vk-audiopad/common'
import { createChrome } from '../helpers/chrome'
import { controlledFetch } from '../helpers/fetch'

beforeEach(() => {
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('ResizeObserver', class { observe () {} unobserve () {} disconnect () {} })
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
})
afterEach(cleanup)

const session = async () => {
  const browser = createChrome({ userId: '1', webToken: { userId: '1', accessToken: 'synthetic', expires: Number.MAX_SAFE_INTEGER, error: null } })
  const { startSessionService } = await import('../../packages/service-worker/src/session')
  startSessionService()
  vi.resetModules()
  return browser
}

const mount = async (content: ReactNode) => {
  const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query')
  const { ConfigProvider, AdaptivityProvider, Platform } = await import('@vkontakte/vkui')
  const { Notification } = await import('@/shared/ui/notification')
  const client = new QueryClient()
  const view = render(createElement(QueryClientProvider, { client, children: createElement(ConfigProvider, { platform: Platform.ANDROID, children: createElement(AdaptivityProvider, { children: createElement(Fragment, {}, content, createElement(Notification)) }) }) }))
  return { ...view, client }
}

const catalog = (section = 'synthetic-pop'): commonTypes.JSONObject => ({
  response: {
    section: { id: section, blocks: [{ id: `${section}-tracks`, data_type: 'music_audios', title: 'Поп', audios_ids: ['2_10', '2_11'] }] },
    audios: [{ id: 10, owner_id: 2, title: 'First', artist: 'Artist', duration: 90 }, { id: 11, owner_id: 2, title: 'Second', artist: 'Artist', duration: 95 }]
  }
})

const isSelection = (value: unknown): value is Extract<commonTypes.ServiceWorkerMessage, { type: commonTypes.MessageType.ACTIVE_TRACK }> => typeof value === 'object' && value != null && 'type' in value && value.type === 'active-track'

it('keeps category navigation and playback as separate sibling buttons and toggles the selected collection', async () => {
  const browser = await session()
  const network = vi.fn(async () => Response.json(catalog()))
  vi.stubGlobal('fetch', network)
  const { CatalogGallery } = await import('@/widgets/catalog-gallery')
  const { CatalogBlockDataType } = await import('@/shared/types')
  await mount(createElement(CatalogGallery, {
    userId: '1',
    mode: 'card',
    loadingBlock: 'albums',
    isPending: false,
    catalogBlock: { blockId: 'genres', title: 'Жанры', dataType: CatalogBlockDataType.LINKS, showAllLink: '', layout: 'categories', links: [{ id: 'pop', title: 'Поп', subtitle: '', href: '/music/catalog/synthetic-pop', colors: ['#0088ff'], image: '', foreground: false }] }
  }))
  const open = screen.getByRole('button', { name: 'Поп' })
  const play = screen.getByRole('button', { name: 'Воспроизвести: Поп' })
  expect(open.contains(play)).toBe(false)
  fireEvent.click(play)
  fireEvent.click(play)
  const { commonTypes } = await import('@vk-audiopad/common')
  await waitFor(() => {
    expect(browser.api.runtime.sendMessage.mock.calls.some(([message]) => isSelection(message))).toBe(true)
  })
  expect(network).toHaveBeenCalledOnce()
  expect(browser.snapshot().activeTab).toBeUndefined()
  const message = browser.api.runtime.sendMessage.mock.calls.map(([message]) => message).find(isSelection)
  if (message == null) throw new Error('Expected playback selection')
  expect(message.playlist.tracks.map(track => track.id)).toEqual(['2_10', '2_11'])
  await act(async () => { await browser.api.storage.local.set({ currentPlaylist: message.playlist, playbackRequested: true }) })
  fireEvent.click(screen.getByRole('button', { name: 'Приостановить: Поп' }))
  expect(browser.api.runtime.sendMessage).toHaveBeenLastCalledWith({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.TOGGLE_PLAYBACK })
  expect(network).toHaveBeenCalledOnce()
  fireEvent.click(open)
  await waitFor(() => { expect(browser.snapshot().activeTab).toMatchObject({ tab: 'albums', showAllLink: '/music/catalog/synthetic-pop' }) })
})

it('aborts category selection on unmount and rejects a late response without starting playback', async () => {
  const browser = await session()
  const network = controlledFetch()
  const { PlayCatalogButton } = await import('@/features/play-or-pause-album')
  const view = await mount(createElement(PlayCatalogButton, { userId: '1', item: { id: 'pop', title: 'Поп', subtitle: '', href: '/music/catalog/synthetic-pop', image: '', colors: [], foreground: false } }))
  fireEvent.click(screen.getByRole('button', { name: 'Воспроизвести: Поп' }))
  await waitFor(() => { expect(network.requests).toHaveLength(1) })
  view.unmount()
  expect(network.requests[0].init?.signal?.aborted).toBe(true)
  await act(async () => { network.requests[0].resolve(Response.json(catalog())) })
  expect(browser.api.runtime.sendMessage.mock.calls.some(([message]) => isSelection(message))).toBe(false)
})

it('reports an empty category safely and allows explicit playback retry', async () => {
  const browser = await session()
  const network = vi.fn(async () => Response.json(catalog()))
  network.mockResolvedValueOnce(Response.json({ response: { section: { id: 'synthetic-pop', blocks: [] } } }))
  vi.stubGlobal('fetch', network)
  const { PlayCatalogButton } = await import('@/features/play-or-pause-album')
  await mount(createElement(PlayCatalogButton, { userId: '1', item: { id: 'pop', title: 'Поп', subtitle: '', href: '/music/catalog/synthetic-pop', image: '', colors: [], foreground: false } }))
  const button = screen.getByRole('button', { name: 'Воспроизвести: Поп' })
  fireEvent.click(button)
  await screen.findByText('Не удалось запустить подборку. Повторите попытку')
  expect(browser.api.runtime.sendMessage.mock.calls.some(([message]) => isSelection(message))).toBe(false)
  expect(network).toHaveBeenCalledOnce()
  fireEvent.click(button)
  await waitFor(() => { expect(browser.api.runtime.sendMessage.mock.calls.some(([message]) => isSelection(message))).toBe(true) })
  expect(network).toHaveBeenCalledTimes(2)
})

it.each([96, 81])('renders a server match of %d with the author, three tracks and the complete playback source', async percentage => {
  const browser = await session()
  const { parseTokenCatalog } = await import('@/shared/lib/token-catalog')
  const { CatalogGallery } = await import('@/widgets/catalog-gallery')
  const response = catalog()
  const payload = response.response
  if (payload == null || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Expected fixture payload')
  payload.section = { id: 'listening', blocks: [{ id: 'listen', data_type: 'music_playlists', title: 'Слушайте друг друга', playlists_ids: ['2_50'], meta: { show_all_info: { section_id: 'listening-all' } } }] }
  payload.playlists = [{ id: 50, owner_id: 2, title: 'Плейлист друга', subtitle: `${percentage}% · совпадение с вашим вкусом`, audios_ids: ['2_10', '2_11', '2_12', '2_13'], photo: { photo_300: 'https://images.invalid/cover.jpg' } }]
  payload.audios = [10, 11, 12, 13].map(id => ({ id, owner_id: 2, title: `Track ${id}`, artist: 'Artist', duration: 90 }))
  payload.profiles = [{ id: 2, first_name: 'Synthetic', last_name: 'Listener', photo_100: 'https://images.invalid/avatar.jpg' }]
  const block = parseTokenCatalog(response).blocks[0]
  const network = vi.fn()
  vi.stubGlobal('fetch', network)
  const view = await mount(createElement(CatalogGallery, { userId: '1', mode: 'card', loadingBlock: 'albums', isPending: false, catalogBlock: block }))
  const card = screen.getByRole('article', { name: 'Плейлист друга' })
  expect(within(card).getByText(`${percentage}%`)).not.toBeNull()
  expect(within(card).getByText('Synthetic Listener')).not.toBeNull()
  expect(card.querySelector('img[src="https://images.invalid/avatar.jpg"]')).not.toBeNull()
  expect(within(card).queryByText('Track 13')).toBeNull()
  fireEvent.click(within(card).getByRole('button', { name: /Track 11/ }))
  const { commonTypes } = await import('@vk-audiopad/common')
  expect(browser.api.runtime.sendMessage).toHaveBeenLastCalledWith(expect.objectContaining({ type: commonTypes.MessageType.ACTIVE_TRACK, trackId: '2_11', playlist: expect.objectContaining({ tracks: expect.arrayContaining([expect.objectContaining({ id: '2_13' })]) }) }))
  expect(network).not.toHaveBeenCalled()
  const cover = card.querySelector('img[src="https://images.invalid/cover.jpg"]')
  if (cover == null) throw new Error('Expected supplied artwork')
  fireEvent.error(cover)
  expect(card.querySelector('img[src="https://images.invalid/cover.jpg"]')).toBeNull()
  expect(card.querySelector('.vkap_listening_cover_with_image')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Открыть плейлист «Плейлист друга»' }))
  await waitFor(() => { expect(browser.snapshot().activeTab).toMatchObject({ tab: 'playlist', playlist: { id: '50', ownerId: '2' } }) })
  await act(async () => { view.client.clear() })
})

it('keeps legacy listening preview tracks, author and match metadata when converting a banner', async () => {
  await session()
  const { getCatalogBlocks } = await import('@/shared/lib/catalog-block')
  const { commonTypes } = await import('@vk-audiopad/common')
  const tuple: commonTypes.JSONValue[] = []
  tuple[commonTypes.AudioTupleIndex.ID] = 10
  tuple[commonTypes.AudioTupleIndex.OWNER_ID] = 2
  tuple[commonTypes.AudioTupleIndex.HASHES] = ''
  const raw = { id: '50', ownerId: '2', title: 'Source', list: [tuple], accessHash: 'synthetic-key' }
  const html = '<div class="CatalogBlock--divided"><h2 class="CatalogBlock__title">Слушайте друг друга</h2><div data-id="listen" data-type="music_playlists"><div data-id="2_50_synthetic-key"><div class="BannerItem__content"><a class="BannerItem__link" href="https://vk.ru/music/album/2_50_synthetic-key"></a><img class="Banner__backgroundImage" src="https://images.invalid/cover.jpg"><div class="BannerItem__title">Плейлист друга</div><div class="BannerItem__text"><img src="https://images.invalid/avatar.jpg">Synthetic Listener</div><div class="BannerItem__subtext">96% · совпадение с вашим вкусом</div></div></div></div></div>'
  const [block] = getCatalogBlocks({ payload: [0, [html, { blockIds: ['listen'], playlists: [raw] }]] })
  expect(block).toMatchObject({ title: 'Слушайте друг друга', albums: [{ title: 'Плейлист друга', tracks: [{ id: '2_10' }], authorName: 'Synthetic Listener', authorAvatarUrl: 'https://images.invalid/avatar.jpg', infoLine: '96% · совпадение с вашим вкусом', accessHash: 'synthetic-key' }] })
})

it('loads missing preview tracks through the existing playlist adapter and offers explicit retry', async () => {
  await session()
  const { playlist } = await import('../helpers/playback')
  const { commonTypes } = await import('@vk-audiopad/common')
  const { CatalogBlockDataType } = await import('@/shared/types')
  const { CatalogGallery } = await import('@/widgets/catalog-gallery')
  const tuple: commonTypes.JSONValue[] = []
  tuple[commonTypes.AudioTupleIndex.ID] = 10
  tuple[commonTypes.AudioTupleIndex.OWNER_ID] = 2
  tuple[commonTypes.AudioTupleIndex.TITLE] = 'Loaded preview'
  tuple[commonTypes.AudioTupleIndex.HASHES] = ''
  const network = vi.fn(async () => Response.json({ payload: [0, [{ id: '50', ownerId: '2', title: 'Friend', list: [tuple] }]] }))
  network.mockRejectedValueOnce(new Error('synthetic-private-value'))
  vi.stubGlobal('fetch', network)
  const album = { ...playlist([], '50'), ownerId: '2', blockId: '', coverUrl: '', gridCoverUrls: [], authorLine: '', authorName: '', infoLine: '' }
  const view = await mount(createElement(CatalogGallery, { userId: '1', mode: 'card', loadingBlock: 'albums', isPending: false, catalogBlock: { blockId: 'listening', dataType: CatalogBlockDataType.ALBUMS, title: 'Слушайте друг друга', showAllLink: '', albums: [album] } }))
  const retry = await screen.findByRole('button', { name: 'Повторить' })
  expect(network).toHaveBeenCalledOnce()
  expect(document.body.textContent).not.toContain('synthetic-private-value')
  expect(document.body.textContent).not.toContain('совпадение с вашим вкусом')
  fireEvent.click(retry)
  await screen.findByText('Loaded preview')
  expect(network).toHaveBeenCalledTimes(2)
  await act(async () => { view.client.clear() })
})

// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { type vkPlaylists } from '@vk-audiopad/common'
import { CatalogBlockDataType, type CatalogBlock, type TracksCatalogBlock } from '@/shared/types'
import { type TokenCatalogPage } from '@/shared/lib/token-catalog'
import { type FetchMyMusicResult } from '../../packages/front/src/pages/my-music/model/types'
import { type FetchExploreResult } from '../../packages/front/src/pages/explore/model/types'
import { createChrome } from '../helpers/chrome'
import { deferred } from '../helpers/deferred'
import { playlist } from '../helpers/playback'

beforeEach(() => {
  createChrome({ userId: '1' })
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('ResizeObserver', class { observe () {} unobserve () {} disconnect () {} })
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
})

afterEach(() => {
  cleanup()
  for (const path of ['@/shared/api', '@/widgets/navigation', '../../packages/front/src/pages/my-music/api/fetchers', '../../packages/front/src/pages/explore/api/fetchers']) vi.doUnmock(path)
})

const tracks = (blockId = 'recent', title = 'Недавно прослушанные', id = '1_1'): TracksCatalogBlock => ({ dataType: CatalogBlockDataType.TRACKS, blockId, playlist: { ...playlist([id]), title } })
const library = (blockId = 'library', token = true): CatalogBlock => ({ dataType: CatalogBlockDataType.ALBUMS, blockId, title: 'Плейлисты', albums: [], showAllLink: '/music/catalog/library', library: token })
const myPage = (firstBlock: CatalogBlock = tracks()): FetchMyMusicResult => ({ firstBlock, otherBlocks: [library('legacy-library', false)], lastTracksCatalogBlock: null })
const tokenPage = (blocks: CatalogBlock[] = [tracks('token-recent'), library()]): TokenCatalogPage => ({ blocks, sectionId: 'token', nextFrom: '' })
const libraryPage = { items: [{ ownerId: '1', id: '10', title: 'Сохранённый плейлист', description: '', count: 2, accessKey: '', editable: true }], nextOffset: null }

const setup = async (tab: 'my-music' | 'explore' = 'my-music', active = true) => {
  const legacy = deferred<FetchMyMusicResult & FetchExploreResult>()
  const token = deferred<TokenCatalogPage>()
  const playlists = deferred<Awaited<ReturnType<typeof vkPlaylists.getPlaylists>>>()
  const fetchLegacy = vi.fn((_userId: string, _signal?: AbortSignal) => legacy.promise)
  const fetchHomeHighlights = vi.fn((_userId: string, _signal?: AbortSignal) => token.promise)
  const fetchCatalogSection = vi.fn(async () => tokenPage([]))
  vi.doMock('../../packages/front/src/pages/my-music/api/fetchers', () => ({ fetchMyMusic: fetchLegacy }))
  vi.doMock('../../packages/front/src/pages/explore/api/fetchers', () => ({ fetchExplore: fetchLegacy, fetchMoreExplore: vi.fn() }))
  vi.doMock('@/shared/api', async original => ({ ...await original<typeof import('@/shared/api')>(), fetchHomeHighlights, fetchCatalogSection }))
  vi.doMock('@/widgets/navigation', () => ({ Navigation: () => null }))
  const common = await import('@vk-audiopad/common')
  const getPlaylists = vi.spyOn(common.vkPlaylists, 'getPlaylists').mockImplementation(async () => await playlists.promise)
  const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query')
  const { ConfigProvider, AdaptivityProvider, Platform } = await import('@vkontakte/vkui')
  const { MyMusic } = await import('@/pages/my-music')
  const { Explore } = await import('@/pages/explore')
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })
  const content = (userId: string, visible: boolean) => createElement(QueryClientProvider, { client, children: createElement(ConfigProvider, { platform: Platform.ANDROID, children: createElement(AdaptivityProvider, { children: createElement(tab === 'my-music' ? MyMusic : Explore, { userId, active: visible }) }) }) })
  const view = render(content('1', active))
  const resolveLegacy = async (data: FetchMyMusicResult | FetchExploreResult) => { await act(async () => { legacy.resolve({ ...myPage(), blocks: [], sectionId: '', nextFrom: '', ...data }) }) }
  return { ...view, client, content, legacy, token, playlists, fetchLegacy, fetchHomeHighlights, fetchCatalogSection, getPlaylists, resolveLegacy }
}

it('starts the library with both catalogs and keeps its controls and focus mounted as the sources arrive', async () => {
  const page = await setup()
  expect(page.fetchLegacy).toHaveBeenCalledOnce()
  expect(page.fetchHomeHighlights).toHaveBeenCalledOnce()
  expect(page.getPlaylists).toHaveBeenCalledWith('1', 0, expect.any(AbortSignal), 'library')
  await act(async () => { page.playlists.resolve(libraryPage) })
  const tile = await screen.findByRole('button', { name: 'Сохранённый плейлист' })
  act(() => { tile.focus() })
  await page.resolveLegacy(myPage())
  const first = await screen.findByRole('button', { name: 'Воспроизвести 1_1' })
  expect(screen.getAllByRole('heading', { name: 'Плейлисты' })).toHaveLength(1)
  expect(screen.getAllByRole('status').length).toBeGreaterThan(0)
  const recent = tracks('token-recent')
  recent.playlist.catalogLayout = 'list'
  await act(async () => { page.token.resolve(tokenPage([recent, library(), tracks('more', 'Далее', '1_2')])) })
  await screen.findByRole('heading', { name: 'Далее' })
  expect(screen.getByRole('button', { name: 'Сохранённый плейлист' })).toBe(tile)
  expect(document.activeElement).toBe(tile)
  expect(screen.getAllByRole('button', { name: 'Воспроизвести 1_1' })[0]).toBe(first)
  expect(screen.getAllByRole('heading', { name: 'Плейлисты' })).toHaveLength(1)
  expect(page.getPlaylists).toHaveBeenCalledOnce()
  expect(page.fetchCatalogSection).not.toHaveBeenCalled()
})

it('shows tracks while the independent library is slow and keeps token order on a token-first completion', async () => {
  const page = await setup()
  await act(async () => { page.token.resolve(tokenPage()) })
  const first = await screen.findByRole('button', { name: 'Воспроизвести 1_1' })
  expect(screen.getAllByLabelText('Загрузка плейлистов')).toHaveLength(4)
  await page.resolveLegacy(myPage())
  await act(async () => { page.playlists.resolve(libraryPage) })
  await screen.findByRole('button', { name: 'Сохранённый плейлист' })
  expect(screen.getByRole('button', { name: 'Воспроизвести 1_1' })).toBe(first)
  expect(screen.getAllByRole('heading').map(element => element.textContent)).toEqual(['Недавно прослушанные', 'Плейлисты'])
})

it('replaces a legacy-only playlist block with the independent library exactly once', async () => {
  const page = await setup()
  await page.resolveLegacy(myPage(library('first-library', false)))
  await act(async () => { page.playlists.resolve(libraryPage) })
  expect(screen.getAllByRole('heading', { name: 'Плейлисты' })).toHaveLength(1)
  await act(async () => { page.token.resolve(tokenPage([library()])) })
  expect(screen.getAllByRole('heading', { name: 'Плейлисты' })).toHaveLength(1)
})

it('retains the library and fast track controls through catalog failure and retry', async () => {
  const page = await setup()
  await page.resolveLegacy(myPage())
  await act(async () => { page.playlists.resolve(libraryPage) })
  const first = await screen.findByRole('button', { name: 'Воспроизвести 1_1' })
  const tile = screen.getByRole('button', { name: 'Сохранённый плейлист' })
  await act(async () => { page.token.reject(new Error('Synthetic catalog failure')) })
  const retry = await screen.findByRole('button', { name: 'Повторить' })
  expect(tile.compareDocumentPosition(retry) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  page.fetchHomeHighlights.mockResolvedValueOnce(tokenPage())
  fireEvent.click(retry)
  await waitFor(() => { expect(screen.queryByRole('button', { name: 'Повторить' })).toBeNull() })
  expect(screen.getByRole('button', { name: 'Сохранённый плейлист' })).toBe(tile)
  expect(screen.getByRole('button', { name: 'Воспроизвести 1_1' })).toBe(first)
})

it('preserves tracks when library loading fails and retries only the library', async () => {
  const page = await setup()
  await page.resolveLegacy(myPage())
  await act(async () => { page.playlists.reject(new Error('Synthetic library failure')) })
  const first = await screen.findByRole('button', { name: 'Воспроизвести 1_1' })
  page.getPlaylists.mockResolvedValueOnce(libraryPage)
  fireEvent.click(await screen.findByRole('button', { name: 'Повторить' }))
  await screen.findByRole('button', { name: 'Сохранённый плейлист' })
  expect(screen.getByRole('button', { name: 'Воспроизвести 1_1' })).toBe(first)
  expect(page.fetchLegacy).toHaveBeenCalledOnce()
  expect(page.fetchHomeHighlights).toHaveBeenCalledOnce()
})

it.each(['my-music', 'explore'] as const)('keeps %s idle until activation and reuses fresh data after return', async tab => {
  const page = await setup(tab, false)
  expect(page.fetchLegacy).not.toHaveBeenCalled()
  expect(page.fetchHomeHighlights).not.toHaveBeenCalled()
  expect(page.getPlaylists).not.toHaveBeenCalled()
  page.rerender(page.content('1', true))
  await page.resolveLegacy({ blocks: [tracks()], sectionId: 'legacy', nextFrom: '' })
  await act(async () => { page.token.resolve(tokenPage()); page.playlists.resolve(libraryPage) })
  await screen.findByRole('heading', { name: 'Недавно прослушанные' })
  page.rerender(page.content('1', false))
  page.rerender(page.content('1', true))
  expect(page.fetchLegacy).toHaveBeenCalledOnce()
  expect(page.fetchHomeHighlights).toHaveBeenCalledOnce()
})

it('pins the first titled Explore block and matches nonbreaking spaces without duplicate rows', async () => {
  const page = await setup('explore')
  await page.resolveLegacy({ blocks: [{ blockId: 'promo', dataType: CatalogBlockDataType.BANNERS, title: '', albums: [], showAllLink: '' }, tracks('legacy', 'Сегодня в\u00a0плеере')], sectionId: 'legacy', nextFrom: '' })
  const first = await screen.findByRole('button', { name: 'Воспроизвести 1_1' })
  act(() => { first.focus() })
  await act(async () => { page.token.resolve(tokenPage([tracks('token', 'Сегодня в плеере'), tracks('more', 'Новинки', '1_2')])) })
  await screen.findByRole('heading', { name: 'Новинки' })
  expect(screen.getAllByRole('heading').map(element => element.textContent)).toEqual(['Сегодня в\u00a0плеере', 'Новинки'])
  expect(screen.getAllByRole('button', { name: 'Воспроизвести 1_1' })[0]).toBe(first)
  expect(document.activeElement).toBe(first)
})

it('keeps late account responses out of the new music and playlist views', async () => {
  const page = await setup()
  const nextLegacy = deferred<FetchMyMusicResult & FetchExploreResult>()
  const nextToken = deferred<TokenCatalogPage>()
  const nextPlaylists = deferred<typeof libraryPage>()
  page.fetchLegacy.mockReturnValueOnce(nextLegacy.promise)
  page.fetchHomeHighlights.mockReturnValueOnce(nextToken.promise)
  page.getPlaylists.mockReturnValueOnce(nextPlaylists.promise)
  page.rerender(page.content('2', true))
  await page.resolveLegacy(myPage(tracks('old', 'Старая музыка')))
  await act(async () => { page.token.resolve(tokenPage()); page.playlists.resolve(libraryPage) })
  expect(screen.queryByRole('heading', { name: 'Старая музыка' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Сохранённый плейлист' })).toBeNull()
  await act(async () => {
    nextLegacy.resolve({ ...myPage(tracks('new', 'Новая музыка')), blocks: [], sectionId: '', nextFrom: '' })
    nextPlaylists.resolve({ ...libraryPage, items: [{ ...libraryPage.items[0], ownerId: '2', title: 'Новый плейлист' }] })
  })
  await screen.findByRole('heading', { name: 'Новая музыка' })
  await screen.findByRole('button', { name: 'Новый плейлист' })
})

it.each(['my-music', 'explore'] as const)('retries both failed catalog sources on %s while retaining the independent library', async tab => {
  vi.useFakeTimers()
  const page = await setup(tab)
  await act(async () => {
    page.legacy.reject(new Error('Synthetic legacy failure'))
    page.token.reject(new Error('Synthetic catalog failure'))
    page.playlists.resolve(libraryPage)
    await vi.advanceTimersByTimeAsync(4000)
  })
  expect(page.fetchLegacy).toHaveBeenCalledTimes(3)
  page.fetchLegacy.mockResolvedValueOnce({ ...myPage(), blocks: [tracks()], sectionId: 'legacy', nextFrom: '' })
  page.fetchHomeHighlights.mockResolvedValueOnce(tokenPage())
  fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
  await act(async () => { await vi.advanceTimersByTimeAsync(50) })
  expect(screen.getByRole('button', { name: 'Воспроизвести 1_1' })).toBeTruthy()
  expect(page.fetchLegacy).toHaveBeenCalledTimes(4)
  expect(page.fetchHomeHighlights).toHaveBeenCalledTimes(2)
  if (tab === 'my-music') expect(page.getPlaylists).toHaveBeenCalledOnce()
  vi.useRealTimers()
})

it('keeps one token continuation owner after early Explore content and retains rows during paging', async () => {
  const page = await setup('explore')
  await page.resolveLegacy({ blocks: [tracks()], sectionId: 'legacy', nextFrom: 'legacy-next' })
  const first = await screen.findByRole('button', { name: 'Воспроизвести 1_1' })
  expect(page.fetchCatalogSection).not.toHaveBeenCalled()
  await act(async () => { page.token.resolve({ ...tokenPage([tracks()]), nextFrom: 'next' }) })
  fireEvent.click(await screen.findByRole('button', { name: 'Ещё подборки' }))
  await waitFor(() => { expect(page.fetchCatalogSection).toHaveBeenCalledOnce() })
  expect(page.fetchCatalogSection).toHaveBeenCalledWith('token', 'next', expect.any(AbortSignal))
  expect(page.fetchLegacy).toHaveBeenCalledOnce()
  expect(screen.getByRole('button', { name: 'Воспроизвести 1_1' })).toBe(first)
})

it.each(['my-music', 'explore'] as const)('retains %s content and refreshes invalidated queries only on reactivation', async tab => {
  const page = await setup(tab)
  await page.resolveLegacy({ blocks: [tracks()], sectionId: 'legacy', nextFrom: '' })
  await act(async () => { page.token.resolve(tokenPage()); page.playlists.resolve(libraryPage) })
  const first = await screen.findByRole('button', { name: 'Воспроизвести 1_1' })
  page.rerender(page.content('1', false))
  await act(async () => { await page.client.invalidateQueries() })
  expect(page.fetchLegacy).toHaveBeenCalledOnce()
  expect(page.fetchHomeHighlights).toHaveBeenCalledOnce()
  page.fetchLegacy.mockReturnValueOnce(deferred<FetchMyMusicResult & FetchExploreResult>().promise)
  page.fetchHomeHighlights.mockReturnValueOnce(deferred<TokenCatalogPage>().promise)
  page.rerender(page.content('1', true))
  await waitFor(() => { expect(page.fetchLegacy).toHaveBeenCalledTimes(2) })
  expect(page.fetchHomeHighlights).toHaveBeenCalledTimes(2)
  expect(screen.getByRole('button', { name: 'Воспроизвести 1_1' })).toBe(first)
})

// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { type CatalogBlock, type TracksCatalogBlock, CatalogBlockDataType } from '@/shared/types'
import { type TokenCatalogPage } from '@/shared/lib/token-catalog'
import { type FetchResult } from '../../packages/front/src/pages/general/model/types'
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
  vi.useRealTimers()
  for (const path of ['@/shared/api', '@/widgets/navigation', '@/widgets/vk-mix', '../../packages/front/src/pages/general/api/fetchers']) vi.doUnmock(path)
})

const tracks = (blockId: string, title: string, id = '1_1'): TracksCatalogBlock => ({
  dataType: CatalogBlockDataType.TRACKS,
  blockId,
  playlist: { ...playlist([id]), title, tracks: [{ ...playlist([id]).tracks[0], title: 'Первый трек' }] }
})
const legacyPage = (blocks: CatalogBlock[]): FetchResult => ({ blocks, sectionId: 'legacy', nextFrom: '' })
const tokenPage = (blocks: CatalogBlock[]): TokenCatalogPage => ({ blocks, sectionId: 'token', nextFrom: '' })

const setup = async (active = true) => {
  const legacy = deferred<FetchResult>()
  const token = deferred<TokenCatalogPage>()
  const fetchGeneral = vi.fn((_userId: string, _signal?: AbortSignal) => legacy.promise)
  const fetchHomeHighlights = vi.fn((_userId: string, _signal?: AbortSignal) => token.promise)
  const fetchCatalogSection = vi.fn()
  vi.doMock('../../packages/front/src/pages/general/api/fetchers', () => ({ fetchGeneral, fetchMore: vi.fn() }))
  vi.doMock('@/shared/api', async importOriginal => ({ ...await importOriginal<typeof import('@/shared/api')>(), fetchHomeHighlights, fetchCatalogSection }))
  vi.doMock('@/widgets/navigation', () => ({ Navigation: () => null }))
  vi.doMock('@/widgets/vk-mix', () => ({ VKMix: () => createElement('button', {}, 'VK Микс') }))
  const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query')
  const { ConfigProvider, AdaptivityProvider, Platform } = await import('@vkontakte/vkui')
  const { General } = await import('@/pages/general')
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })
  const content = (userId: string, visible: boolean) => createElement(QueryClientProvider, { client, children: createElement(ConfigProvider, { platform: Platform.ANDROID, children: createElement(AdaptivityProvider, { children: createElement(General, { userId, active: visible }) }) }) })
  const view = render(content('1', active))
  return { ...view, legacy, token, fetchGeneral, fetchHomeHighlights, fetchCatalogSection, client, content }
}

it('shows fast legacy tracks with a loader below and keeps their DOM and focus when richer data arrives', async () => {
  const home = await setup()
  expect(home.fetchGeneral).toHaveBeenCalledOnce()
  expect(home.fetchHomeHighlights).toHaveBeenCalledOnce()
  expect(home.fetchCatalogSection).not.toHaveBeenCalled()
  await act(async () => { home.legacy.resolve(legacyPage([tracks('legacy-first', 'Для вас')])) })
  const first = await screen.findByRole('button', { name: 'Воспроизвести Первый трек' })
  act(() => { first.focus() })
  expect(screen.getByRole('status')).toBeTruthy()
  const matched = tracks('token-first', 'Для вас')
  matched.playlist.catalogLayout = 'list'
  await act(async () => { home.token.resolve(tokenPage([matched, tracks('second', 'Далее', '1_2')])) })
  expect(screen.getByRole('heading', { name: 'Для вас' })).toBeTruthy()
  expect(await screen.findByRole('heading', { name: 'Далее' })).toBeTruthy()
  expect(screen.queryByRole('status')).toBeNull()
  expect(screen.getAllByRole('button', { name: 'Воспроизвести Первый трек' })[0]).toBe(first)
  expect(document.activeElement).toBe(first)
  expect(screen.getAllByRole('heading', { name: 'Для вас' })).toHaveLength(1)
  expect(home.fetchCatalogSection).not.toHaveBeenCalled()
})

it('keeps a fast token catalog in its original order when the legacy response arrives later', async () => {
  const home = await setup()
  await act(async () => { home.token.resolve(tokenPage([tracks('first', 'Первый блок'), tracks('second', 'Второй блок', '1_2')])) })
  await screen.findByRole('heading', { name: 'Первый блок' })
  const first = screen.getAllByRole('button', { name: 'Воспроизвести Первый трек' })[0]
  await act(async () => { home.legacy.resolve(legacyPage([tracks('legacy-first', 'Второй блок', '1_2')])) })
  expect(screen.getAllByRole('heading').map(element => element.textContent)).toEqual(['Первый блок', 'Второй блок'])
  expect(screen.getAllByRole('button', { name: 'Воспроизвести Первый трек' })[0]).toBe(first)
})

it('retains fast content through a token error and retry without moving the error above the rows', async () => {
  const home = await setup()
  await act(async () => { home.legacy.resolve(legacyPage([tracks('legacy-first', 'Для вас')])) })
  const first = await screen.findByRole('button', { name: 'Воспроизвести Первый трек' })
  await act(async () => { home.token.reject(new Error('Synthetic catalog failure')) })
  const retry = await screen.findByRole('button', { name: 'Повторить' })
  expect(first.compareDocumentPosition(retry) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  home.fetchHomeHighlights.mockResolvedValueOnce(tokenPage([tracks('token-first', 'Для вас')]))
  fireEvent.click(retry)
  await waitFor(() => { expect(screen.queryByRole('button', { name: 'Повторить' })).toBeNull() })
  expect(screen.getByRole('button', { name: 'Воспроизвести Первый трек' })).toBe(first)
  expect(home.fetchGeneral).toHaveBeenCalledOnce()
})

it('starts neither source while inactive and reuses both fresh results on a quick tab return', async () => {
  const home = await setup(false)
  expect(home.fetchGeneral).not.toHaveBeenCalled()
  expect(home.fetchHomeHighlights).not.toHaveBeenCalled()
  home.rerender(home.content('1', true))
  await act(async () => {
    home.legacy.resolve(legacyPage([tracks('legacy-first', 'Для вас')]))
    home.token.resolve(tokenPage([tracks('token-first', 'Для вас')]))
  })
  home.rerender(home.content('1', false))
  home.rerender(home.content('1', true))
  expect(home.fetchGeneral).toHaveBeenCalledOnce()
  expect(home.fetchHomeHighlights).toHaveBeenCalledOnce()
})

it('does not show a previous account response after the account changes', async () => {
  const home = await setup()
  const nextLegacy = deferred<FetchResult>()
  const nextToken = deferred<TokenCatalogPage>()
  home.fetchGeneral.mockReturnValueOnce(nextLegacy.promise)
  home.fetchHomeHighlights.mockReturnValueOnce(nextToken.promise)
  home.rerender(home.content('2', true))
  await act(async () => {
    home.legacy.resolve(legacyPage([tracks('old', 'Старый аккаунт')]))
    home.token.resolve(tokenPage([tracks('old', 'Старый аккаунт')]))
    nextLegacy.resolve(legacyPage([tracks('new', 'Новый аккаунт')]))
  })
  expect(screen.queryByRole('heading', { name: 'Старый аккаунт' })).toBeNull()
  expect(await screen.findByRole('heading', { name: 'Новый аккаунт' })).toBeTruthy()
})

it('uses the first nonempty source when an empty token catalog resolves first', async () => {
  const home = await setup()
  await act(async () => { home.token.resolve(tokenPage([])) })
  await act(async () => { home.legacy.resolve(legacyPage([tracks('legacy-first', 'Для вас')])) })
  expect(await screen.findByRole('button', { name: 'Воспроизвести Первый трек' })).toBeTruthy()
})

it('shows a healthy token catalog while the fast source is failing', async () => {
  const home = await setup()
  await act(async () => {
    home.legacy.reject(new Error('Synthetic legacy failure'))
    home.token.resolve(tokenPage([tracks('token-first', 'Работающий каталог')]))
  })
  expect(await screen.findByRole('heading', { name: 'Работающий каталог' })).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Повторить' })).toBeNull()
})

it('retries both sources explicitly when both initial reads fail', async () => {
  vi.useFakeTimers()
  const home = await setup()
  await act(async () => {
    home.legacy.reject(new Error('Synthetic legacy failure'))
    home.token.reject(new Error('Synthetic catalog failure'))
    await vi.advanceTimersByTimeAsync(4000)
  })
  expect(home.fetchGeneral).toHaveBeenCalledTimes(3)
  home.fetchGeneral.mockResolvedValueOnce(legacyPage([tracks('legacy-first', 'Для вас')]))
  home.fetchHomeHighlights.mockResolvedValueOnce(tokenPage([tracks('token-first', 'Для вас')]))
  fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
  await act(async () => { await vi.advanceTimersByTimeAsync(50) })
  expect(screen.getByRole('button', { name: 'Воспроизвести Первый трек' })).toBeTruthy()
  expect(home.fetchGeneral).toHaveBeenCalledTimes(4)
  expect(home.fetchHomeHighlights).toHaveBeenCalledTimes(2)
})

it('keeps a differently typed rich block with the same ID without replacing the fast track row', async () => {
  const home = await setup()
  const errors = vi.spyOn(console, 'error')
  await act(async () => { home.legacy.resolve(legacyPage([tracks('shared-id', 'Для вас')])) })
  const first = await screen.findByRole('button', { name: 'Воспроизвести Первый трек' })
  await act(async () => { home.token.resolve(tokenPage([{ blockId: 'shared-id', dataType: CatalogBlockDataType.ALBUMS, title: 'Другой вид подборки', albums: [{ ...playlist([]), id: '10', title: 'Коллекция', coverUrl: '', gridCoverUrls: [], authorLine: '', authorName: '', infoLine: '' }], showAllLink: '' }])) })
  expect(await screen.findByRole('heading', { name: 'Другой вид подборки' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Воспроизвести Первый трек' })).toBe(first)
  expect(errors).not.toHaveBeenCalled()
})

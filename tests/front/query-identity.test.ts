// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { deferred } from '../helpers/deferred'
import { playlist } from '../helpers/playback'

afterEach(() => {
  cleanup()
  vi.doUnmock('../../packages/front/src/pages/general/api/fetchers')
  vi.doUnmock('@/shared/api')
  vi.doUnmock('../../packages/front/src/pages/albums/api/fetchers')
})
const queryWrapper = async () => {
  const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query')
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return { client, wrapper: ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client, children }) }
}

it('does not reuse another account\'s general query or adopt its late response', async () => {
  const first = deferred<{ sectionId: string, nextFrom: string, blocks: [] }>()
  const second = deferred<{ sectionId: string, nextFrom: string, blocks: [] }>()
  const fetchGeneral = vi.fn(async (user: string) => await (user === '1' ? first.promise : second.promise))
  vi.doMock('../../packages/front/src/pages/general/api/fetchers', () => ({ fetchGeneral, fetchMore: vi.fn() }))
  const { useGeneralData } = await import('../../packages/front/src/pages/general/model/hooks')
  const { wrapper } = await queryWrapper()
  const view = renderHook(({ userId }) => useGeneralData(userId, true), { initialProps: { userId: '1' }, wrapper })
  await waitFor(() => { expect(fetchGeneral).toHaveBeenCalledOnce() })
  view.rerender({ userId: '2' })
  await waitFor(() => { expect(fetchGeneral).toHaveBeenCalledTimes(2) })
  await act(async () => { second.resolve({ sectionId: 'second', nextFrom: '', blocks: [] }) })
  await waitFor(() => { expect(view.result.current.data?.sectionId).toBe('second') })
  await act(async () => { first.resolve({ sectionId: 'first', nextFrom: '', blocks: [] }) })
  expect(view.result.current.data?.sectionId).toBe('second')
})

it('separates equal playlist IDs belonging to different owners', async () => {
  const fetchPlaylist = vi.fn(async ({ playlist: source }: { playlist: ReturnType<typeof playlist> }) => ({ playlist: source }))
  vi.doMock('@/shared/api', () => ({ fetchPlaylist, fetchMorePlaylistTracks: vi.fn() }))
  const { useBlockPlaylistData } = await import('../../packages/front/src/pages/playlist-tracks/model/hooks')
  const { wrapper } = await queryWrapper()
  const first = { ...playlist([], 'same'), ownerId: '1', blockId: 'block-1' }
  const second = { ...playlist([], 'same'), ownerId: '2', blockId: 'block-2' }
  const view = renderHook(({ source }) => useBlockPlaylistData('1', source, '1'), { initialProps: { source: first }, wrapper })
  await waitFor(() => { expect(view.result.current.data?.playlist.ownerId).toBe('1') })
  view.rerender({ source: second })
  await waitFor(() => { expect(view.result.current.data?.playlist.ownerId).toBe('2') })
  expect(fetchPlaylist).toHaveBeenCalledTimes(2)
})

it('ignores a late response when a refetch has replaced the cached cursor', async () => {
  const page = deferred<{ sectionId: string, nextFrom: string, blocks: [] }>()
  const fetchMore = vi.fn(async () => await page.promise)
  vi.doMock('../../packages/front/src/pages/general/api/fetchers', () => ({ fetchGeneral: vi.fn(), fetchMore }))
  const { useLoadMoreGeneralDataMutation } = await import('../../packages/front/src/pages/general/model/hooks')
  const { client, wrapper } = await queryWrapper()
  const original = { sectionId: 'section', nextFrom: 'A', blocks: [] }
  Object.freeze(original.blocks)
  Object.freeze(original)
  client.setQueryData(['general', '1'], original)
  const view = renderHook(useLoadMoreGeneralDataMutation, { wrapper })
  let pending: Promise<unknown>
  act(() => { pending = view.result.current.mutateAsync({ userId: '1', sectionId: 'section', nextFrom: 'A' }) })
  const refreshed = { sectionId: 'section', nextFrom: 'B', blocks: [] }
  client.setQueryData(['general', '1'], refreshed)
  await act(async () => { page.resolve({ sectionId: 'section', nextFrom: 'C', blocks: [] }); await pending })
  expect(client.getQueryData(['general', '1'])).toEqual(refreshed)
  expect(original.nextFrom).toBe('A')
})

it('applies an albums response to its originating link/account and does not mutate frozen cache or response arrays', async () => {
  const { CatalogBlockDataType } = await import('@/shared/types')
  const album = (id: string, ownerId = '1') => ({ ...playlist([], id), ownerId, coverUrl: '', gridCoverUrls: [], authorLine: '', authorName: '', infoLine: '' })
  const previous = { sectionId: 'section', nextFrom: 'A', blocks: [{ blockId: 'old', dataType: CatalogBlockDataType.ALBUMS, title: '', showAllLink: 'link-A', albums: [album('1')] }] }
  const response = { sectionId: 'section', nextFrom: 'B', blocks: [{ blockId: 'new', dataType: CatalogBlockDataType.ALBUMS, title: '', showAllLink: 'link-A', albums: [album('1'), album('2'), album('1', '2')] }] }
  Object.freeze(previous.blocks[0].albums)
  Object.freeze(previous.blocks)
  Object.freeze(response.blocks[0].albums)
  Object.freeze(response.blocks)
  vi.doMock('../../packages/front/src/pages/albums/api/fetchers', () => ({ fetchAlbums: vi.fn(), fetchMoreAlbums: vi.fn(async () => response) }))
  const { useLoadMoreAlbumsDataMutation } = await import('../../packages/front/src/pages/albums/model/hooks')
  const { client, wrapper } = await queryWrapper()
  client.setQueryData(['albums', '1', 'link-A'], previous)
  client.setQueryData(['albums', '2', 'link-A'], { sectionId: 'other', nextFrom: 'A', blocks: [] })
  client.setQueryData(['albums', '1', 'link-B'], { sectionId: 'other', nextFrom: 'A', blocks: [] })
  const view = renderHook(useLoadMoreAlbumsDataMutation, { wrapper })
  await act(async () => { await view.result.current.mutateAsync({ userId: '1', showAllLink: 'link-A', sectionId: 'section', nextFrom: 'A' }) })
  const merged = client.getQueryData<typeof previous>(['albums', '1', 'link-A'])!
  expect(merged.blocks[0].albums.map(value => `${value.ownerId}_${value.id}`)).toEqual(['1_1', '1_2', '2_1'])
  expect(previous.blocks[0].albums).toHaveLength(1)
  expect(response.blocks[0].albums).toHaveLength(3)
  expect(client.getQueryData(['albums', '2', 'link-A'])).toEqual({ sectionId: 'other', nextFrom: 'A', blocks: [] })
  expect(client.getQueryData(['albums', '1', 'link-B'])).toEqual({ sectionId: 'other', nextFrom: 'A', blocks: [] })
})

it('does not recreate a retired cache when its old page mutation finishes', async () => {
  const response = deferred<{ sectionId: string, nextFrom: string, blocks: [] }>()
  vi.doMock('../../packages/front/src/pages/general/api/fetchers', () => ({ fetchGeneral: vi.fn(), fetchMore: vi.fn(async () => await response.promise) }))
  const { useLoadMoreGeneralDataMutation } = await import('../../packages/front/src/pages/general/model/hooks')
  const { client, wrapper } = await queryWrapper()
  client.setQueryData(['general', '1'], { sectionId: 'section', nextFrom: 'A', blocks: [] })
  const view = renderHook(useLoadMoreGeneralDataMutation, { wrapper })
  let pending: Promise<unknown>
  act(() => { pending = view.result.current.mutateAsync({ userId: '1', sectionId: 'section', nextFrom: 'A' }) })
  client.clear()
  await act(async () => { response.resolve({ sectionId: 'section', nextFrom: 'B', blocks: [] }); await pending })
  expect(client.getQueryCache().getAll()).toHaveLength(0)
})

it('refreshes a cached show-all collection when it is reopened after a playlist mutation', async () => {
  const { CatalogBlockDataType } = await import('@/shared/types')
  const album = { ...playlist([], '10'), ownerId: '1', title: 'Old playlist', coverUrl: '', gridCoverUrls: [], authorLine: '', authorName: '', infoLine: '' }
  let created = false
  const fetchAlbums = vi.fn(async () => ({ sectionId: 'library', nextFrom: '', blocks: [{ blockId: 'playlists', dataType: CatalogBlockDataType.ALBUMS, title: 'Плейлисты', showAllLink: '', albums: created ? [album, { ...album, id: '11', title: 'New playlist' }] : [album] }] }))
  vi.doMock('../../packages/front/src/pages/albums/api/fetchers', () => ({ fetchAlbums }))
  const { useAlbumsData } = await import('../../packages/front/src/pages/albums/model/hooks')
  const { useRefreshPlaylists } = await import('../../packages/front/src/features/manage-playlists/api/playlists')
  const { client, wrapper } = await queryWrapper()
  client.setQueryDefaults(['albums'], { gcTime: Infinity })
  const first = renderHook(() => useAlbumsData('1', '/music/catalog/library'), { wrapper })
  await waitFor(() => { expect(first.result.current.data?.blocks).toHaveLength(1) })
  first.unmount()
  created = true
  const refresh = renderHook(() => useRefreshPlaylists('1'), { wrapper })
  await act(async () => { refresh.result.current() })
  const reopened = renderHook(() => useAlbumsData('1', '/music/catalog/library'), { wrapper })
  await waitFor(() => { expect(fetchAlbums).toHaveBeenCalledTimes(2) })
  await waitFor(() => { expect(reopened.result.current.data?.blocks[0]).toMatchObject({ albums: [{ title: 'Old playlist' }, { title: 'New playlist' }] }) })
  await act(async () => { client.clear() })
})

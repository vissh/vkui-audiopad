// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { type commonTypes } from '@vk-audiopad/common'
import { type CatalogBlock } from '@/shared/types'
import { createChrome } from '../helpers/chrome'

beforeEach(() => {
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('ResizeObserver', class { observe () {} unobserve () {} disconnect () {} })
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
})
afterEach(cleanup)

const response = (): commonTypes.JSONObject => ({
  response: {
    section: {
      id: 'synthetic-home',
      next_from: 'opaque-next',
      blocks: [
        { id: 'genre-heading', data_type: 'none', layout: { name: 'header_extended', title: 'Жанры' } },
        { id: 'genre-buttons', data_type: 'action', layout: { name: 'categories_grid' }, actions: [{ title: 'Электроника', action: { type: 'open_section' }, section_id: 'synthetic-electronic', foreground_images: [{ url: 'https://images.invalid/electronic.png', width: 300 }] }] },
        { id: 'moods', data_type: 'links', title: 'Настроения и занятия', layout: { name: 'categories_grid' }, links_ids: ['focus', 'unsafe'] },
        { id: 'similar', data_type: 'music_recommended_playlists', title: 'Похоже на Hypnotize U (N.E.R.D.)', playlists_ids: ['1_-10'] },
        { id: 'exclusive', data_type: 'music_playlists', title: 'ТОЛЬКО В VK МУЗЫКЕ', layout: { name: 'music_exclusive_slider' }, playlists_ids: ['1_-10'] },
        { id: 'tracks', data_type: 'music_audios', title: 'Треки', layout: { owner_id: 1 }, audios_ids: ['-2_20'] },
        { id: 'unsupported', data_type: 'podcasts', podcast_items_ids: ['1'] }
      ]
    },
    links: [
      { id: 'focus', title: 'Для концентрации', url: '/music/catalog/synthetic-focus', image: [{ url: 'https://images.invalid/focus.jpg', width: 300 }], background: { colors: ['#123456', '#abcdef', 'url(private)'] } },
      { id: 'unsafe', title: 'Unsafe', url: 'https://outside.invalid/music/catalog/token' }
    ],
    playlists: [{ id: -10, owner_id: 1, title: 'Серверная подборка', count: 2, access_key: 'synthetic-key', thumbs: [{ photo_300: 'https://images.invalid/one.jpg' }, { photo_300: 'https://images.invalid/two.jpg' }] }],
    audios: [{ id: 20, owner_id: -2, title: 'Server track', artist: 'Artist', duration: 180 }]
  }
})

it('preserves server group order, titles, category destinations, recommendation covers and exclusive layout', async () => {
  const { parseTokenCatalog } = await import('@/shared/lib/token-catalog')
  const page = parseTokenCatalog(response())
  expect(page.sectionId).toBe('synthetic-home')
  expect(page.nextFrom).toBe('opaque-next')
  expect(page.blocks.map(block => block.dataType === 'tracks' ? block.playlist.title : block.title)).toEqual(['Жанры', 'Настроения и занятия', 'Похоже на Hypnotize U (N.E.R.D.)', 'ТОЛЬКО В VK МУЗЫКЕ', 'Треки'])
  expect(page.blocks[0]).toMatchObject({ dataType: 'links', links: [{ title: 'Электроника', href: '/music/catalog/synthetic-electronic', foreground: true }] })
  expect(page.blocks[1]).toMatchObject({ dataType: 'links', links: [{ id: 'focus', colors: ['#123456', '#abcdef'] }] })
  expect(page.blocks[2]).toMatchObject({ dataType: 'albums', albums: [{ id: '-10', gridCoverUrls: ['https://images.invalid/one.jpg', 'https://images.invalid/two.jpg'] }] })
  expect(page.blocks[3].dataType).toBe('banners')
  expect(page.blocks[4]).toMatchObject({ dataType: 'tracks', playlist: { tracks: [{ id: '-2_20', title: 'Server track' }] } })
})

it('selects the advertised default section and rejects malformed roots safely', async () => {
  const { parseTokenCatalog } = await import('@/shared/lib/token-catalog')
  expect(parseTokenCatalog({ response: { catalog: { default_section: 'home', sections: [{ id: 'other' }, { id: 'home', blocks: [] }] } } })).toEqual({ sectionId: 'home', nextFrom: '', blocks: [] })
  expect(() => parseTokenCatalog({ response: {} })).toThrow('format')
})

it('rejects off-site and executable category destinations', async () => {
  const { catalogDestination } = await import('@/shared/lib/token-catalog')
  for (const href of ['javascript:alert(1)', '//outside.invalid/music/catalog/token', 'https://vk.ru/away.php?to=private']) expect(catalogDestination(href)).toBe('')
  expect(catalogDestination('/music/catalog/opaque-token')).toBe('https://vk.ru/music/catalog/opaque-token')
})

const setup = async () => {
  const browser = createChrome({ userId: '1', webToken: { userId: '1', accessToken: 'synthetic', expires: Number.MAX_SAFE_INTEGER, error: null } })
  const { startSessionService } = await import('../../packages/service-worker/src/session')
  startSessionService()
  vi.resetModules()
  return browser
}

it('resolves root catalog pointers and carries the exact section cursor through the shared session client', async () => {
  await setup()
  const network = vi.fn(async (input: string, _init?: RequestInit) => Response.json(input.includes('catalog.getAudio?')
    ? { response: { catalog: { sections: [{ id: 'synthetic-home', blocks: [] }] } } }
    : response()))
  vi.stubGlobal('fetch', network)
  const { fetchHomeHighlights, fetchCatalogSection } = await import('@/shared/api')
  expect((await fetchHomeHighlights('1')).blocks).toHaveLength(5)
  await fetchCatalogSection('synthetic-home', 'opaque-next')
  expect(network).toHaveBeenCalledTimes(3)
  expect(new URLSearchParams(String(network.mock.calls[0][1]?.body)).get('url')).toBe('https://vk.ru/audios1?section=general')
  expect(new URLSearchParams(String(network.mock.calls[2][1]?.body)).get('start_from')).toBe('opaque-next')
})

it('renders categories as named VKUI buttons and navigates inside the extension', async () => {
  const browser = await setup()
  const { ConfigProvider, AdaptivityProvider, Platform } = await import('@vkontakte/vkui')
  const { CatalogGallery } = await import('@/widgets/catalog-gallery')
  const { parseTokenCatalog } = await import('@/shared/lib/token-catalog')
  const block = parseTokenCatalog(response()).blocks[0]
  render(createElement(ConfigProvider, { platform: Platform.ANDROID, children: createElement(AdaptivityProvider, { children: createElement(CatalogGallery, { mode: 'plain', isPending: false, loadingBlock: 'albums', userId: '1', catalogBlock: block }) }) }))
  const button = screen.getByRole('button', { name: 'Электроника' })
  button.focus()
  expect(document.activeElement).toBe(button)
  expect(button.parentElement?.querySelector('img')?.getAttribute('src')).toBe('https://images.invalid/electronic.png')
  fireEvent.click(button)
  await waitFor(() => { expect(browser.snapshot().activeTab).toMatchObject({ tab: 'albums', showAllLink: '/music/catalog/synthetic-electronic' }) })
})

it('offers explicit retry for missing highlights while leaving the legacy catalog available', async () => {
  await setup()
  const network = vi.fn(async () => Response.json(response()))
  network.mockRejectedValueOnce(new Error('synthetic-private-value'))
  vi.stubGlobal('fetch', network)
  const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query')
  const { HomeHighlights } = await import('../../packages/front/src/pages/general/ui/HomeHighlights')
  const { ConfigProvider, AdaptivityProvider, Platform } = await import('@vkontakte/vkui')
  const client = new QueryClient()
  render(createElement(QueryClientProvider, { client, children: createElement(ConfigProvider, { platform: Platform.ANDROID, children: createElement(AdaptivityProvider, { children: createElement(HomeHighlights, { userId: '1', active: true, existing: [] }) }) }) }))
  fireEvent.click(await screen.findByRole('button', { name: 'Повторить' }))
  await screen.findByRole('heading', { name: 'Жанры' })
  expect(network).toHaveBeenCalledTimes(2)
  expect(document.body.textContent).not.toContain('synthetic-private-value')
  await act(async () => { client.clear() })
})

it('keeps link pages immutable and updates repeated IDs in their original position', async () => {
  const { parseTokenCatalog } = await import('@/shared/lib/token-catalog')
  const { mergeCatalogBlocks } = await import('@/shared/lib/pagination')
  const initial = parseTokenCatalog(response()).blocks[1]
  if (initial.dataType !== 'links') throw new Error('Expected links')
  Object.freeze(initial.links)
  Object.freeze(initial)
  const next = { ...initial, links: [{ ...initial.links[0], title: 'Updated' }, { ...initial.links[0], id: 'new', title: 'New' }] }
  const [merged] = mergeCatalogBlocks([initial], [next])
  expect(merged).toMatchObject({ links: [{ id: 'focus', title: 'Updated' }, { id: 'new', title: 'New' }] })
  expect(initial.links[0].title).toBe('Для концентрации')
})

it('renders owned playlists as cover tiles, keeps grid artwork and opens the selected server playlist', async () => {
  const browser = await setup()
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({
    response: {
      count: 2,
      items: [
        { id: 10, owner_id: 1, title: 'Для работы', count: 2, photo: { photo_300: 'https://images.invalid/cover.jpg' } },
        { id: 11, owner_id: 1, title: 'В дороге', count: 3, thumbs: [{ photo_300: 'https://images.invalid/one.jpg' }, { photo_300: 'https://images.invalid/two.jpg' }] }
      ]
    }
  })))
  const { MyPlaylists } = await import('@/features/manage-playlists')
  const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query')
  const { ConfigProvider, AdaptivityProvider, Platform } = await import('@vkontakte/vkui')
  const client = new QueryClient()
  render(createElement(QueryClientProvider, { client, children: createElement(ConfigProvider, { platform: Platform.ANDROID, children: createElement(AdaptivityProvider, { children: createElement(MyPlaylists, { userId: '1', active: true }) }) }) }))
  const first = (await screen.findByText('Для работы')).closest('button')
  const second = screen.getByText('В дороге').closest('button')
  expect(first?.querySelector('img')?.getAttribute('src')).toBe('https://images.invalid/cover.jpg')
  expect(second?.querySelectorAll('[style*="background-image"]')).toHaveLength(2)
  if (second == null) throw new Error('Expected playlist button')
  fireEvent.click(second)
  await waitFor(() => { expect(browser.snapshot().activeTab).toMatchObject({ tab: 'playlist', playlist: { ownerId: '1', id: '11' } }) })
  await act(async () => { client.clear() })
})

it('rejects a catalog response belonging to another section', async () => {
  await setup()
  vi.stubGlobal('fetch', vi.fn(async () => Response.json(response())))
  const { fetchCatalogSection } = await import('@/shared/api')
  await expect(fetchCatalogSection('another-section')).rejects.toMatchObject({ kind: 'format' })
})

it('inherits show-all actions from headers and resolves live Mix, friend and listening recommendation formats', async () => {
  const { parseTokenCatalog } = await import('@/shared/lib/token-catalog')
  const page = parseTokenCatalog({
    response: {
      section: {
        id: 'home',
        blocks: [
          { id: 'heading', data_type: 'none', title: 'Слушайте друг друга', layout: { name: 'header_extended' }, actions: [{ action: { type: 'open_section' }, section_id: 'all-listening' }] },
          { id: 'listening', data_type: 'music_recommended_playlists', playlists_ids: ['2_10'] },
          { id: 'genres', data_type: 'action', title: 'Жанры', layout: { name: 'crop_slider' }, actions: [{ id: 'rock', title: 'Рок', action: { type: 'play_vk_mix' }, mix_id: 'genre-rock', mix_options: 'synthetic-options', images: [{ url: 'https://images.invalid/rock.jpg' }] }] },
          { id: 'friends', data_type: 'links', title: 'Музыка друзей', layout: { name: 'slider' }, links_ids: ['friend'] }
        ]
      },
      playlists: [{ id: 10, owner_id: 2, title: 'Friend playlist' }],
      profiles: [{ id: 2, first_name: 'Synthetic', last_name: 'Friend', photo_100: 'https://images.invalid/avatar.jpg' }],
      recommended_playlists: [{ id: 10, owner_id: 2, percentage: 0.96, cover: 'https://images.invalid/listening.jpg', audios: [{ owner_id: 2, id: 20, artist: 'Artist', title: 'Preview', duration: 90 }] }],
      links: [{ id: 'friend', title: 'Synthetic Friend', subtitle: '10 аудиозаписей', image: [{ url: 'https://images.invalid/friend.jpg' }], url: 'https://vk.ru/audios2' }]
    }
  })
  expect(page.blocks[0]).toMatchObject({ title: 'Слушайте друг друга', showAllLink: '/music/catalog/all-listening', albums: [{ infoLine: '96%', authorName: 'Synthetic Friend', coverUrl: 'https://images.invalid/listening.jpg', tracks: [{ id: '2_20', title: 'Preview' }] }] })
  expect(page.blocks[1]).toMatchObject({ layout: 'categories', links: [{ title: 'Рок', href: '', mixId: 'genre-rock', mixOptions: 'synthetic-options' }] })
  expect(page.blocks[2]).toMatchObject({ layout: 'friends', links: [{ title: 'Synthetic Friend', friendOwnerId: '2', href: 'https://vk.ru/audios2' }] })
})

it('parses enabled radio streams, retains artwork and excludes unsafe or disabled stations', async () => {
  const { parseTokenCatalog } = await import('@/shared/lib/token-catalog')
  const page = parseTokenCatalog({
    response: {
      section: { id: 'radio', blocks: [{ id: 'stations', data_type: 'radiostations', title: 'Радиостанции', radio_stations_ids: [1, 2, 3] }] },
      radio_stations: [
        { id: 1, name: 'Synthetic FM', stream_url: 'https://streams.invalid/radio.mp3', logo_png_url: 'https://images.invalid/radio.png', background_color: '123456', is_enabled: true },
        { id: 2, name: 'Disabled', stream_url: 'https://streams.invalid/off.mp3', is_enabled: false },
        { id: 3, name: 'Unsafe', stream_url: 'javascript:alert(1)', is_enabled: true }
      ]
    }
  })
  expect(page.blocks).toMatchObject([{ dataType: 'tracks', playlist: { isRadio: true, tracks: [{ id: 'radio_1', title: 'Synthetic FM', url: 'https://streams.invalid/radio.mp3', image: 'https://images.invalid/radio.png', radioBackground: '#123456' }] } }])
  if (page.blocks[0].dataType !== 'tracks') throw new Error('Expected radio')
  expect(page.blocks[0].playlist.tracks).toHaveLength(1)
})

it('starts a server-provided genre Mix and toggles it without opening a fabricated category', async () => {
  const browser = await setup()
  const { PlayMixButton } = await import('@/features/play-or-pause-album')
  const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query')
  const { ConfigProvider, AdaptivityProvider } = await import('@vkontakte/vkui')
  render(createElement(QueryClientProvider, { client: new QueryClient(), children: createElement(ConfigProvider, { children: createElement(AdaptivityProvider, { children: createElement(PlayMixButton, { userId: '1', item: { id: 'rock', title: 'Рок', subtitle: '', href: '', image: '', foreground: false, colors: [], mixId: 'genre-rock', mixOptions: 'synthetic-options' } }) }) }) }))
  fireEvent.click(screen.getByRole('button', { name: 'Воспроизвести: Рок' }))
  await waitFor(() => { expect(browser.api.runtime.sendMessage.mock.calls.some(([value]) => typeof value === 'object' && value != null && 'type' in value && value.type === 'active-track')).toBe(true) })
  const selected = browser.api.runtime.sendMessage.mock.calls.map(([value]) => value).find((value): value is { playlist: commonTypes.Playlist } => typeof value === 'object' && value != null && 'playlist' in value)
  expect(selected?.playlist).toMatchObject({ isVkMix: true, mixId: 'genre-rock', mixOptions: 'synthetic-options', tracks: [] })
  await act(async () => { await browser.api.storage.local.set({ currentPlaylist: selected?.playlist, playbackRequested: true }) })
  fireEvent.click(screen.getByRole('button', { name: 'Приостановить: Рок' }))
  expect(browser.api.runtime.sendMessage.mock.calls.some(([value]) => typeof value === 'object' && value != null && 'type' in value && value.type === 'toggle-playback')).toBe(true)
  expect(browser.snapshot().activeTab).toBeUndefined()
})

it('loads an intersecting continuation once, merges groups and stops a repeated cursor', async () => {
  await setup()
  vi.doMock('react-intersection-observer', () => ({ useInView: () => ({ ref: () => {}, inView: true }) }))
  const network = vi.fn(async (input: string) => Response.json(input.includes('getAudio?')
    ? { response: { section: { id: 'explore', next_from: 'next', blocks: [{ id: 'first', data_type: 'links', title: 'Первая группа', links_ids: ['one'] }] }, links: [{ id: 'one', title: 'Открыть', url: '/music/catalog/one' }] } }
    : { response: { section: { id: 'explore', next_from: 'next', blocks: [{ id: 'friends', data_type: 'links', title: 'Музыка друзей', links_ids: ['friend'] }] }, links: [{ id: 'friend', title: 'Synthetic Friend', url: 'https://vk.ru/audios2' }] } }))
  vi.stubGlobal('fetch', network)
  const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query')
  const { CatalogFeed } = await import('@/widgets/catalog-gallery')
  const { ConfigProvider, AdaptivityProvider } = await import('@vkontakte/vkui')
  const client = new QueryClient()
  const tree = createElement(QueryClientProvider, { client, children: createElement(ConfigProvider, { children: createElement(AdaptivityProvider, { children: createElement(CatalogFeed, { userId: '1', active: true, section: 'explore' }) }) }) })
  const view = render(tree)
  await screen.findByRole('heading', { name: 'Музыка друзей' })
  expect(screen.getByRole('heading', { name: 'Первая группа' })).not.toBeNull()
  expect(network).toHaveBeenCalledTimes(2)
  view.rerender(tree)
  expect(network).toHaveBeenCalledTimes(2)
  expect(screen.queryByRole('button', { name: 'Ещё подборки' })).toBeNull()
  vi.doUnmock('react-intersection-observer')
})

it('keeps one server-titled track block when legacy IDs agree but their titles differ', async () => {
  await setup()
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ response: { section: { id: 'all', blocks: [{ id: 'same-block', data_type: 'music_audios', title: 'Треки', layout: { name: 'list' }, audios_ids: ['1_10'] }] }, audios: [{ owner_id: 1, id: 10, title: 'Track', artist: 'Artist', duration: 60 }] } })))
  const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query')
  const { CatalogFeed } = await import('@/widgets/catalog-gallery')
  const { ConfigProvider, AdaptivityProvider } = await import('@vkontakte/vkui')
  const { playlist } = await import('../helpers/playback')
  const { CatalogBlockDataType } = await import('@/shared/types')
  render(createElement(QueryClientProvider, { client: new QueryClient(), children: createElement(ConfigProvider, { children: createElement(AdaptivityProvider, { children: createElement(CatalogFeed, { userId: '1', active: true, section: 'all', existing: [{ blockId: 'same-block', dataType: CatalogBlockDataType.TRACKS, playlist: { ...playlist(['1_10']), title: 'Мои аудиозаписи' } }] }) }) }) }))
  await screen.findByRole('heading', { name: 'Треки' })
  expect(screen.queryByRole('heading', { name: 'Мои аудиозаписи' })).toBeNull()
})

it('accepts internal curator, artist and album destinations while retaining origin checks', async () => {
  const { catalogDestination } = await import('@/shared/lib/token-catalog')
  expect(catalogDestination('https://vk.ru/audios-20')).toBe('https://vk.ru/audios-20')
  expect(catalogDestination('/artist/synthetic')).toBe('https://vk.ru/artist/synthetic')
  expect(catalogDestination('/music/album/-20_30_synthetic')).toBe('https://vk.ru/music/album/-20_30_synthetic')
  expect(catalogDestination('https://outside.invalid/music/album/-20_30_synthetic')).toBe('')
})

it('keeps radio following independent of playback and adopts a later authoritative follow state', async () => {
  const browser = await setup()
  const network = vi.fn(async () => Response.json({ response: 1 }))
  vi.stubGlobal('fetch', network)
  const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query')
  const { CatalogGallery } = await import('@/widgets/catalog-gallery')
  const { ConfigProvider, AdaptivityProvider } = await import('@vkontakte/vkui')
  const { playlist, track } = await import('../helpers/playback')
  const { CatalogBlockDataType } = await import('@/shared/types')
  const client = new QueryClient()
  const tree = (followed: boolean) => createElement(QueryClientProvider, { client, children: createElement(ConfigProvider, { children: createElement(AdaptivityProvider, { children: createElement(CatalogGallery, { userId: '1', mode: 'plain', isPending: false, loadingBlock: 'tracks', catalogBlock: { dataType: CatalogBlockDataType.TRACKS, blockId: 'radio', playlist: { ...playlist([]), isRadio: true, title: 'Радиостанции', tracks: [{ ...track('radio_24'), title: 'Synthetic FM', radioFollowed: followed }] } } }) }) }) })
  const view = render(tree(false))
  fireEvent.click(screen.getByRole('button', { name: 'Добавить в мою музыку: Synthetic FM' }))
  await screen.findByRole('button', { name: 'Удалить из моей музыки: Synthetic FM' })
  expect(network).toHaveBeenCalledOnce()
  expect(browser.api.runtime.sendMessage.mock.calls.some(([value]) => typeof value === 'object' && value != null && 'type' in value && value.type === 'active-track')).toBe(false)
  view.rerender(tree(true))
  view.rerender(tree(false))
  await screen.findByRole('button', { name: 'Добавить в мою музыку: Synthetic FM' })
})

it('opens a promotional album through the playlist route while keeping its access key out of catalog query identity', async () => {
  const browser = await setup()
  const { parseTokenCatalog } = await import('@/shared/lib/token-catalog')
  const { CatalogGallery } = await import('@/widgets/catalog-gallery')
  const { ConfigProvider, AdaptivityProvider } = await import('@vkontakte/vkui')
  const page = parseTokenCatalog({ response: { section: { id: 'promo', blocks: [{ id: 'banners', title: 'Премьера', data_type: 'catalog_banners', layout: { name: 'promo_banners_slider' }, catalog_banner_ids: [1] }] }, catalog_banners: [{ id: 1, title: 'Synthetic album', click_action: { action: { type: 'open_url', url: '/music/album/-20_30_synthetic-key' } } }] } })
  render(createElement(ConfigProvider, { children: createElement(AdaptivityProvider, { children: createElement(CatalogGallery, { userId: '1', mode: 'plain', isPending: false, loadingBlock: 'albums', catalogBlock: page.blocks[0] }) }) }))
  fireEvent.click(screen.getByRole('button', { name: 'Synthetic album' }))
  await waitFor(() => { expect(browser.snapshot().activeTab).toMatchObject({ tab: 'playlist', playlist: { ownerId: '-20', id: '30', accessHash: 'synthetic-key' } }) })
})

it('resolves a curator through its dedicated catalog method and retains community authors', async () => {
  await setup()
  const network = vi.fn(async (_url: string, _init?: RequestInit) => Response.json({ response: { catalog: { sections: [{ id: 'curator-section', blocks: [{ id: 'editorial', data_type: 'music_playlists', title: 'Подборки', playlists_ids: ['-3_10'] }] }] }, playlists: [{ id: 10, owner_id: -3, title: 'Curated playlist' }], groups: [{ id: 3, name: 'Synthetic curator', photo_100: 'https://images.invalid/curator.jpg' }] } }))
  vi.stubGlobal('fetch', network)
  const { fetchCuratorCatalog } = await import('@/shared/api')
  const { vkApiClient } = await import('@vk-audiopad/common')
  expect((await fetchCuratorCatalog('synthetic')).blocks[0]).toMatchObject({ albums: [{ authorName: 'Synthetic curator' }] })
  expect(network.mock.calls[0][0]).toContain('/method/catalog.getAudioCurator?')
  expect(new URLSearchParams(String(network.mock.calls[0][1]?.body)).get('curator_id')).toBe('synthetic')
  await expect(vkApiClient.getCuratorCatalog('../unsafe')).rejects.toThrow('format')
  expect(network).toHaveBeenCalledOnce()
})

it('renders the authoritative catalog without waiting for legacy data or flashing legacy groups', async () => {
  await setup()
  const { controlledFetch } = await import('../helpers/fetch')
  const network = controlledFetch()
  const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query')
  const { CatalogFeed } = await import('@/widgets/catalog-gallery')
  const { ConfigProvider, AdaptivityProvider } = await import('@vkontakte/vkui')
  const { playlist } = await import('../helpers/playback')
  const { CatalogBlockDataType } = await import('@/shared/types')
  const existing: CatalogBlock[] = [{ blockId: 'legacy', dataType: CatalogBlockDataType.TRACKS, playlist: { ...playlist(['1_10']), title: 'Мои аудиозаписи' } }]
  const client = new QueryClient()
  const tree = (legacy: CatalogBlock[]) => createElement(QueryClientProvider, { client, children: createElement(ConfigProvider, { children: createElement(AdaptivityProvider, { children: createElement(CatalogFeed, { userId: '1', active: true, section: 'all', existing: legacy }) }) }) })
  const view = render(tree([]))
  expect(screen.getByLabelText('Загрузка подборок')).not.toBeNull()
  expect(screen.queryByRole('heading', { name: 'Мои аудиозаписи' })).toBeNull()
  await waitFor(() => { expect(network.requests).toHaveLength(1) })
  await act(async () => { network.requests[0].resolve(Response.json({ response: { section: { id: 'all', blocks: [{ id: 'friends', data_type: 'links', title: 'Музыка друзей', links_ids: ['friend'] }] }, links: [{ id: 'friend', title: 'Friend', url: '/audios2' }] } })) })
  await screen.findByRole('heading', { name: 'Музыка друзей' })
  expect(screen.queryByLabelText('Загрузка подборок')).toBeNull()
  view.rerender(tree(existing))
  await screen.findByRole('heading', { name: 'Музыка друзей' })
  expect(screen.queryByLabelText('Загрузка подборок')).toBeNull()
  expect(screen.queryByRole('heading', { name: 'Мои аудиозаписи' })).toBeNull()
})

it('preserves separate artist Mix backgrounds and foreground portraits', async () => {
  const { parseTokenCatalog } = await import('@/shared/lib/token-catalog')
  const { CatalogTiles } = await import('@/shared/ui/catalog-tiles')
  const { ConfigProvider } = await import('@vkontakte/vkui')
  const page = parseTokenCatalog({ response: { section: { id: 'home', blocks: [{ id: 'artists', title: 'Микс по артистам', data_type: 'action', layout: { name: 'large_slider', style: 'artist_mix' }, actions: [{ id: 'mix', title: 'Artist', mix_id: 'artist_synthetic', action: { type: 'play_vk_mix' }, images: [{ url: 'https://images.invalid/background.png', width: 320, height: 392 }], foreground_images: [{ url: 'https://images.invalid/portrait.png', width: 270, height: 270 }] }] }] } } })
  const block = page.blocks[0]
  if (block.dataType !== 'links') throw new Error('Expected artist links')
  expect(block.links[0]).toMatchObject({ image: 'https://images.invalid/background.png', foregroundImage: 'https://images.invalid/portrait.png' })
  render(createElement(ConfigProvider, { children: createElement(CatalogTiles, { items: block.links, layout: block.layout, onSelect: vi.fn() }) }))
  expect([...document.querySelectorAll('img')].map(image => image.getAttribute('src'))).toEqual(['https://images.invalid/background.png', 'https://images.invalid/portrait.png'])
})

it.each(['friends', 'artists'] as const)('keeps a neutral avatar and a usable named %s cell after an image failure', async layout => {
  const { CatalogTiles } = await import('@/shared/ui/catalog-tiles')
  const { ConfigProvider } = await import('@vkontakte/vkui')
  const select = vi.fn()
  const item = { id: 'person', title: 'Synthetic Person', subtitle: '', href: '', image: 'https://images.invalid/person.jpg', foreground: false, colors: [] }
  const view = render(createElement(ConfigProvider, { children: createElement(CatalogTiles, { items: [item], layout, onSelect: select }) }))
  const image = view.container.querySelector('img')
  if (image == null) throw new Error('Missing person image')
  expect(view.container.querySelector('.vkuiIcon--user_outline_28')).toBeNull()
  fireEvent.error(image)
  expect(view.container.querySelector('.vkuiIcon--user_outline_28')).not.toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Synthetic Person' }))
  expect(select).toHaveBeenCalledExactlyOnceWith(item)
})

it('marks only the newly requested genre while its audio is still loading', async () => {
  const browser = await setup()
  const { playlist } = await import('../helpers/playback')
  const rock = { ...playlist([], 'rock'), isVkMix: true, mixId: 'common', mixOptions: '{"additionals":["rock"]}' }
  await browser.api.storage.local.set({ currentPlaylist: rock, playbackRequested: false })
  const { PlayMixButton } = await import('@/features/play-or-pause-album')
  const { ConfigProvider } = await import('@vkontakte/vkui')
  const items = ['rock', 'pop'].map(id => ({ id, title: id, subtitle: '', href: '', image: '', foreground: false, colors: [], mixId: 'common', mixOptions: JSON.stringify({ additionals: [id] }) }))
  render(createElement(ConfigProvider, { children: items.map(item => createElement(PlayMixButton, { key: item.id, userId: '1', item })) }))
  await act(async () => { await browser.api.storage.local.get() })
  await act(async () => { await browser.api.storage.local.set({ playbackRequested: true, playbackSelection: { ...rock, id: 'pop', mixOptions: items[1].mixOptions } }) })
  expect(screen.getByRole('button', { name: 'Воспроизвести: rock' }).getAttribute('aria-pressed')).toBe('false')
  expect(screen.getByRole('button', { name: 'Приостановить: pop' }).getAttribute('aria-pressed')).toBe('true')
  expect(browser.snapshot().currentPlaylist).toMatchObject({ id: 'rock' })
})

it('preserves each artist Mix entity and distinguishes artists sharing the same mix_id', async () => {
  const browser = await setup()
  const { parseTokenCatalog } = await import('@/shared/lib/token-catalog')
  const { CatalogGallery } = await import('@/widgets/catalog-gallery')
  const { ConfigProvider } = await import('@vkontakte/vkui')
  const page = parseTokenCatalog({ response: { section: { id: 'home', blocks: [{ id: 'mixes', data_type: 'action', title: 'Микс по артистам', layout: { name: 'large_slider' }, actions: ['42', '43'].map(entity => ({ id: entity, title: `Artist ${entity}`, mix_id: 'artist_mix', entity_id: entity, action: { type: 'play_vk_mix' } })) }] } } })
  render(createElement(ConfigProvider, { children: createElement(CatalogGallery, { userId: '1', mode: 'card', isPending: false, loadingBlock: 'albums', catalogBlock: page.blocks[0] }) }))
  fireEvent.click(screen.getByRole('button', { name: 'Воспроизвести: Artist 42' }))
  await waitFor(() => { expect(browser.api.runtime.sendMessage.mock.calls.some(([value]) => typeof value === 'object' && value != null && 'playlist' in value)).toBe(true) })
  const selected = browser.api.runtime.sendMessage.mock.calls.map(([value]) => value).find((value): value is { playlist: commonTypes.Playlist } => typeof value === 'object' && value != null && 'playlist' in value)
  expect(selected?.playlist).toMatchObject({ mixId: 'artist_mix', mixEntityId: '42' })
  await act(async () => { await browser.api.storage.local.set({ currentPlaylist: selected?.playlist, playbackRequested: true }) })
  expect(screen.getByRole('button', { name: 'Приостановить: Artist 42' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Воспроизвести: Artist 43' })).toBeTruthy()
})

it('uses real playlist photos in the full collection while keeping recommendation artwork in the listening rail', async () => {
  await setup()
  const { parseTokenCatalog } = await import('@/shared/lib/token-catalog')
  const { AlbumCell } = await import('@/entities/album')
  const { ConfigProvider } = await import('@vkontakte/vkui')
  const page = parseTokenCatalog({ response: { section: { id: 'listen', blocks: [{ id: 'all', data_type: 'music_recommended_playlists', title: 'Слушайте друг друга', playlists_ids: ['2_10'] }] }, playlists: [{ id: 10, owner_id: 2, title: 'Playlist', photo: { photo_300: 'https://images.invalid/real-cover.jpg' } }], recommended_playlists: [{ id: 10, owner_id: 2, cover: 'https://images.invalid/gradient.jpg' }] } })
  const block = page.blocks[0]
  if (!('albums' in block)) throw new Error('Expected albums')
  expect(block.albums[0].coverUrl).toBe('https://images.invalid/gradient.jpg')
  render(createElement(ConfigProvider, { children: createElement(AlbumCell, { album: block.albums[0], onClick: vi.fn() }) }))
  expect(document.querySelector('img')?.getAttribute('src')).toBe('https://images.invalid/real-cover.jpg')
})

it('keeps related artist cards from the current artist catalog and opens their artist page', async () => {
  const browser = await setup()
  const network = vi.fn(async (input: RequestInfo | URL) => Response.json(String(input).includes('catalog.getAudioArtist')
    ? { response: { catalog: { sections: [{ id: 'artist', blocks: [{ id: 'related', data_type: 'links', title: 'Вам могут понравиться', links_ids: ['related'] }] }] }, links: [{ id: 'related', title: 'Related artist', url: 'https://vk.ru/artist/related', image: 'https://images.invalid/artist.jpg' }] } }
    : { payload: [0, ['<div></div>', { blockIds: [], playlists: [] }]] }))
  vi.stubGlobal('fetch', network)
  const { fetchArtistData } = await import('../../packages/front/src/pages/artist/api/fetchers')
  const result = await fetchArtistData('synthetic')
  expect(result.blocks[0]).toMatchObject({ title: 'Вам могут понравиться', layout: 'artists', links: [{ artist: { id: 'related', name: 'Related artist' } }] })
  const { CatalogGallery } = await import('@/widgets/catalog-gallery')
  const { ConfigProvider } = await import('@vkontakte/vkui')
  render(createElement(ConfigProvider, { children: createElement(CatalogGallery, { userId: '1', mode: 'card', isPending: false, loadingBlock: 'albums', catalogBlock: result.blocks[0] }) }))
  fireEvent.click(screen.getByRole('button', { name: 'Related artist' }))
  await waitFor(() => { expect(browser.snapshot().activeTab).toMatchObject({ tab: 'artist', id: 'related' }) })
})

it('keeps original authors, their avatars and native playlist counters in album collections', async () => {
  const { parseTokenCatalog } = await import('../../packages/front/src/shared/lib/token-catalog')
  const page = parseTokenCatalog({
    response: {
      section: { id: 'library', blocks: [{ id: 'playlists', data_type: 'music_playlists', playlists_ids: ['1_10'] }] },
      playlists: [{ id: 10, owner_id: 1, title: 'Followed collection', original: { owner_id: 2, playlist_id: 20 }, count: 187, plays: 1_896_364 }],
      profiles: [{ id: 1, first_name: 'Library owner' }, { id: 2, first_name: 'Original author', photo_50: 'https://images.invalid/author.jpg' }]
    }
  })
  expect(page.blocks[0]).toMatchObject({ albums: [{ authorName: 'Original author', authorAvatarUrl: 'https://images.invalid/author.jpg', trackCount: 187, playCount: 1_896_364 }] })
})

it('reuses fresh catalog data on a quick return and refreshes invalidated or expired data', async () => {
  await setup()
  let version = 0
  const network = vi.fn(async () => Response.json({ response: { section: { id: 'fresh', blocks: [{ id: 'cards', data_type: 'links', title: `Version ${++version}`, links_ids: ['card'] }] }, links: [{ id: 'card', title: 'Card', url: '/music/catalog/card' }] } }))
  vi.stubGlobal('fetch', network)
  const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query')
  const { ConfigProvider, AdaptivityProvider } = await import('@vkontakte/vkui')
  const { CatalogFeed } = await import('@/widgets/catalog-gallery')
  const { catalogStaleTime } = await import('@/shared/api')
  const client = new QueryClient()
  const tree = (active: boolean) => createElement(QueryClientProvider, { client, children: createElement(ConfigProvider, { children: createElement(AdaptivityProvider, { children: createElement(CatalogFeed, { userId: '1', active }) }) }) })
  const view = render(tree(true))
  await screen.findByText('Version 1')
  vi.useFakeTimers()
  view.rerender(tree(false))
  view.rerender(tree(true))
  await act(async () => { await vi.advanceTimersByTimeAsync(20) })
  vi.useRealTimers()
  expect(network).toHaveBeenCalledOnce()
  view.rerender(tree(false))
  await act(async () => { await client.invalidateQueries({ queryKey: ['audioCatalog', '1'] }) })
  expect(network).toHaveBeenCalledOnce()
  view.rerender(tree(true))
  await screen.findByText('Version 2')
  expect(network).toHaveBeenCalledTimes(2)
  view.rerender(tree(false))
  await act(async () => { client.setQueryData(['audioCatalog', '1', 'general'], data => data, { updatedAt: Date.now() - catalogStaleTime - 1 }) })
  view.rerender(tree(true))
  await screen.findByText('Version 3')
  expect(network).toHaveBeenCalledTimes(3)
  await act(async () => { client.clear() })
})

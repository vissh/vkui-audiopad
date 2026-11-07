// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { type commonTypes } from '@vk-audiopad/common'
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

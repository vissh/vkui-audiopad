// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import axe from 'axe-core'
import { type Album } from '@/shared/types'
import { createChrome } from '../helpers/chrome'
import { track } from '../helpers/playback'

beforeEach(() => {
  document.documentElement.lang = 'ru'
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('ResizeObserver', class { observe () {} unobserve () {} disconnect () {} })
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
})
afterEach(() => { cleanup(); vi.doUnmock('../../packages/front/src/pages/general/api/fetchers') })

const mount = async (content: ReactNode) => {
  const { ConfigProvider, AdaptivityProvider, Platform } = await import('@vkontakte/vkui')
  return render(createElement(ConfigProvider, { platform: Platform.ANDROID, children: createElement(AdaptivityProvider, { children: createElement('main', {}, createElement('h1', {}, 'Музыка'), content) }) }))
}

const audit = async (container: HTMLElement) => {
  const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
  expect(result.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.html) }))).toEqual([])
}

it('separates track playback, artist navigation and actions into named keyboard controls', async () => {
  createChrome()
  const { TrackCell } = await import('@/entities/track')
  const { ArtistTitle } = await import('@/shared/ui/artist-title')
  const source = { ...track('1_10'), title: 'Первый трек', mainArtists: [Object.freeze({ id: 'artist', name: 'Artist &amp; Co' })] }
  const play = vi.fn()
  const artist = vi.fn()
  const action = vi.fn()
  const view = await mount(createElement('div', { role: 'list' }, createElement(TrackCell, {
    title: source.title,
    artist: createElement(ArtistTitle, { track: source, onArtist: artist, onSearch: vi.fn() }),
    duration: 90,
    image: 'https://images.invalid/track.jpg',
    trackState: 'normal',
    onClick: play,
    actions: createElement('button', { onClick: (event) => { event.stopPropagation(); action() } }, 'Добавить')
  })))
  await audit(view.container)
  for (const name of ['Воспроизвести Первый трек', 'Artist & Co', 'Добавить']) {
    const button = screen.getByRole('button', { name })
    expect(button.closest('button, [role="button"]')).toBe(button)
    button.focus()
    expect(document.activeElement).toBe(button)
    fireEvent.click(button)
  }
  expect(play).toHaveBeenCalledOnce()
  expect(artist).toHaveBeenCalledExactlyOnceWith(source.mainArtists[0])
  expect(action).toHaveBeenCalledOnce()
  expect(source.mainArtists[0].name).toBe('Artist &amp; Co')
})

it('keeps album navigation and overlay actions independent in the accessibility tree', async () => {
  createChrome()
  const { AlbumCell } = await import('@/entities/album')
  const { RecommendedPlaylist } = await import('@/entities/recommended-playlist')
  const album: Album = { id: '10', ownerId: '1', blockId: '', title: 'Подборка', tracks: [], accessHash: '', followHash: '', isFollowed: false, isVkMix: false, isRadio: false, nextOffset: '', hasMore: false, coverUrl: 'https://images.invalid/cover.jpg', gridCoverUrls: [], authorLine: 'Исполнители', authorName: 'Автор', infoLine: '' }
  const open = vi.fn()
  const play = vi.fn()
  const action = createElement('button', { onClick: (event) => { event.stopPropagation(); play() } }, 'Слушать подборку')
  const view = await mount(createElement('div', {}, createElement(AlbumCell, { album, onClick: open, overlay: action }), createElement('ul', {}, createElement(RecommendedPlaylist, { album, onClick: open, action }))))
  await audit(view.container)
  for (const button of screen.getAllByRole('button', { name: 'Слушать подборку' })) fireEvent.click(button)
  expect(play).toHaveBeenCalledTimes(2)
  expect(open).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: /Подборка.*Исполнители/ }))
  expect(open).toHaveBeenCalledOnce()
})

it('exposes playback modes and meaningful seek/volume values without announcing timer ticks', async () => {
  const browser = createChrome({ shuffle: true, castToStatus: false, duration: 180, currentTime: 30, volume: 0.5, activeTrack: track('1_10') })
  const commands = vi.fn()
  browser.api.runtime.onMessage.addListener(message => commands(message))
  const { Player } = await import('@/widgets/player')
  const view = await mount(createElement(Player))
  await act(async () => { await browser.api.storage.local.get() })
  await audit(view.container)
  expect(screen.getByRole('button', { name: 'Перемешать' }).getAttribute('aria-pressed')).toBe('true')
  expect(screen.getByRole('button', { name: 'Транслировать музыку в статус' }).getAttribute('aria-pressed')).toBe('false')
  const seek = screen.getByRole('slider', { name: 'Позиция воспроизведения' })
  expect(seek.getAttribute('aria-valuetext')).toBe('0:30 из 3:00')
  fireEvent.change(seek, { target: { value: '31' } })
  expect(commands).toHaveBeenLastCalledWith({ target: 'service-worker', type: 'current-time', value: 31 })
  expect(screen.getByRole('slider', { name: 'Громкость' }).getAttribute('aria-valuetext')).toBe('50%')
  expect(seek.closest('[aria-live]')).toBeNull()
})

it('hides decorative skeletons and retains one loading status', async () => {
  const { SkeletonWrapper } = await import('@/shared/ui/skeleton-wrapper')
  const view = await mount(createElement(SkeletonWrapper, { isPending: true, skeleton: createElement('button', {}, 'Шаблон'), children: createElement('button', {}, 'Готово') }))
  expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true')
  expect(screen.queryByRole('button')).toBeNull()
  expect(view.container.querySelector('[inert]')).not.toBeNull()
  view.rerender(createElement(SkeletonWrapper, { isPending: false, skeleton: null, children: createElement('button', {}, 'Готово') }))
  expect(screen.getByRole('button', { name: 'Готово' })).not.toBeNull()
})

it('renders an accessible token-first Home while both sources load once without premature continuation', async () => {
  const legacy = vi.fn(async () => ({ sectionId: 'legacy', nextFrom: '', blocks: [] }))
  vi.doMock('../../packages/front/src/pages/general/api/fetchers', () => ({ fetchGeneral: legacy, fetchMore: vi.fn() }))
  const browser = createChrome({ userId: '1', activeTab: { tab: 'general' }, webToken: { userId: '1', accessToken: 'synthetic', expires: Number.MAX_SAFE_INTEGER, error: null } })
  const { startSessionService } = await import('../../packages/service-worker/src/session')
  startSessionService()
  vi.resetModules()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  const network = vi.fn(async (_input: string) => Response.json({ response: { section: { id: 'home', next_from: 'next', blocks: [{ id: 'genres', title: 'Жанры', data_type: 'action', layout: { name: 'categories_grid' }, actions: [{ id: 'pop', title: 'Поп', action: { type: 'play_vk_mix' }, mix_id: 'pop' }] }] } } }))
  vi.stubGlobal('fetch', network)
  const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query')
  const { General } = await import('@/pages/general')
  const client = new QueryClient()
  const view = await mount(createElement(QueryClientProvider, { client, children: createElement('div', { id: 'tab-content-general', role: 'tabpanel', 'aria-label': 'Главная' }, createElement(General, { userId: '1', active: true })) }))
  await screen.findByRole('heading', { name: 'Жанры' })
  expect(network).toHaveBeenCalledOnce()
  expect(legacy).toHaveBeenCalledOnce()
  expect(String(network.mock.calls[0]?.[0])).toContain('catalog.getAudio')
  await waitFor(() => { expect(screen.getByRole('button', { name: 'Ещё подборки' })).not.toBeNull() })
  await audit(view.container)
  await act(async () => { await browser.api.storage.local.get(); client.clear() })
})

it('presents radio station cards as a labelled list', async () => {
  createChrome()
  const { CatalogGallery } = await import('@/widgets/catalog-gallery')
  const { CatalogBlockDataType } = await import('@/shared/types')
  const { playlist } = await import('../helpers/playback')
  const stations = { ...playlist(['radio_1', 'radio_2']), isRadio: true, title: 'Радиостанции' }
  const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query')
  const client = new QueryClient()
  const view = await mount(createElement(QueryClientProvider, { client, children: createElement(CatalogGallery, { userId: '1', mode: 'card', isPending: false, loadingBlock: 'tracks', catalogBlock: { dataType: CatalogBlockDataType.TRACKS, blockId: 'radio', playlist: stations } }) }))
  expect(screen.getByRole('list', { name: 'Радиостанции' })).not.toBeNull()
  await audit(view.container)
})

it('offers keyboard-focusable queue reorder actions with boundary guards', async () => {
  createChrome()
  const { EditableTrack } = await import('../../packages/front/src/pages/current-playlist/ui/EditableTrack')
  const move = vi.fn()
  const view = await mount(createElement('div', { role: 'list' }, createElement(EditableTrack, { track: { ...track('1_10'), title: 'Первый' }, trackIndex: 0, trackCount: 2, onDragFinish: move, onRemove: vi.fn() })))
  const up = screen.getByRole('button', { name: 'Выше: Первый' })
  up.focus()
  expect(document.activeElement).toBe(up)
  fireEvent.click(up)
  expect(move).not.toHaveBeenCalled()
  const down = screen.getByRole('button', { name: 'Ниже: Первый' })
  down.focus()
  fireEvent.click(down)
  expect(move).toHaveBeenCalledExactlyOnceWith({ from: 0, to: 1 })
  await audit(view.container)
})

it('starts the fast Home source immediately and keeps it available after a token-catalog failure', async () => {
  const browser = createChrome({ userId: '1', activeTab: { tab: 'general' }, webToken: { userId: '1', accessToken: 'synthetic', expires: Number.MAX_SAFE_INTEGER, error: null } })
  const { startSessionService } = await import('../../packages/service-worker/src/session')
  startSessionService()
  vi.resetModules()
  const fallback = vi.fn(async () => ({ sectionId: 'fallback', nextFrom: '', blocks: [] }))
  vi.doMock('../../packages/front/src/pages/general/api/fetchers', () => ({ fetchGeneral: fallback, fetchMore: vi.fn() }))
  try {
    const network = vi.fn(async () => { throw new Error('Synthetic unavailable catalog') })
    vi.stubGlobal('fetch', network)
    const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query')
    const { General } = await import('@/pages/general')
    const client = new QueryClient()
    await mount(createElement(QueryClientProvider, { client, children: createElement(General, { userId: '1', active: true }) }))
    expect(fallback).toHaveBeenCalledOnce()
    await screen.findByRole('button', { name: 'Повторить' })
    await waitFor(() => { expect(fallback).toHaveBeenCalledOnce() })
    expect(network).toHaveBeenCalledOnce()
    await act(async () => { await browser.api.storage.local.get(); client.clear() })
  } finally {
    vi.doUnmock('../../packages/front/src/pages/general/api/fetchers')
  }
})

it('keeps navigation dialog actions in the keyboard tab order', async () => {
  createChrome()
  const { ActionTabs } = await import('../../packages/front/src/widgets/navigation/ui/ActionTabs')
  const view = await mount(createElement(ActionTabs))
  for (const name of ['Поддержать проект', 'Настройки']) {
    const button = screen.getByRole('button', { name })
    expect(button.tabIndex).toBe(0)
    button.focus()
    expect(document.activeElement).toBe(button)
    expect(button.getAttribute('aria-haspopup')).toBe('dialog')
  }
  await audit(view.container)
})

it('reveals row actions for keyboard focus and releases pointer-restored focus', async () => {
  createChrome()
  const { TrackCell } = await import('@/entities/track')
  await mount(createElement('div', { role: 'list' }, createElement(TrackCell, { title: 'Трек', artist: 'Артист', image: '', duration: 90, trackState: 'normal', actions: createElement('button', {}, 'Действие') })))
  const button = screen.getByRole('button', { name: 'Действие' })
  const row = button.closest('.vkap_track_cell')
  const matches = vi.spyOn(button, 'matches').mockReturnValue(false)
  act(() => { button.focus() })
  expect(document.activeElement).toBe(button)
  expect(row?.classList.contains('vkap_track_cell_keyboard_focus')).toBe(false)
  act(() => { button.blur() })
  matches.mockReturnValue(true)
  act(() => { button.focus() })
  expect(row?.classList.contains('vkap_track_cell_keyboard_focus')).toBe(true)
  fireEvent.pointerDown(button)
  expect(document.activeElement).toBe(button)
  expect(row?.classList.contains('vkap_track_cell_keyboard_focus')).toBe(false)
})

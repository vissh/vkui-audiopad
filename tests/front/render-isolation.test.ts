// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createElement, useEffect, useState } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { playlist, track } from '../helpers/playback'

const pageModules = [
  ['@/pages/current-playlist', 'CurrentPlaylist'],
  ['@/pages/general', 'General'],
  ['@/pages/my-music', 'MyMusic'],
  ['@/pages/explore', 'Explore'],
  ['@/pages/radio', 'Radio'],
  ['@/pages/albums', 'Albums'],
  ['@/pages/artist', 'ArtistResult'],
  ['@/pages/playlist-tracks', 'PlaylistTracks'],
  ['@/pages/search-result', 'SearchResult']
]

afterEach(() => {
  cleanup()
  for (const [path] of pageModules) vi.doUnmock(path)
  vi.doUnmock('@/entities/track')
  vi.doUnmock('@/features/delete-from-my-music')
  vi.doUnmock('@/features/search-artist')
  vi.doUnmock('@/features/similar')
})

it('mounts a main page on its first visit and retains its draft when returning', async () => {
  const browser = createChrome({ userId: '1', activeTab: { tab: 'general' } })
  vi.resetModules()
  const mounts = new Map<string, number>()
  for (const [path, name] of pageModules) {
    vi.doMock(path, () => ({
      [name]: ({ active }: { active: boolean }) => {
        const [draft, setDraft] = useState(0)
        useEffect(() => { mounts.set(name, (mounts.get(name) ?? 0) + 1) }, [])
        return createElement('div', { hidden: !active }, createElement('button', { onClick: () => { setDraft(value => value + 1) } }, `${name} draft ${draft}`))
      }
    }))
  }
  const { commonTypes } = await import('@vk-audiopad/common')
  const { Pages } = await import('../../packages/front/src/app/Pages')
  const { setActiveTab } = await import('@/shared/model')
  render(createElement(Pages))
  await act(async () => { await browser.api.storage.local.get() })
  expect(mounts).toEqual(new Map([['General', 1]]))
  await act(async () => { setActiveTab({ tab: commonTypes.ContentTab.CURRENT_PLAYLIST }) })
  fireEvent.click(screen.getByRole('button', { name: 'CurrentPlaylist draft 0' }))
  await act(async () => { setActiveTab({ tab: commonTypes.ContentTab.GENERAL }) })
  expect(screen.queryByRole('button', { name: 'CurrentPlaylist draft 1' })).toBeNull()
  await act(async () => { setActiveTab({ tab: commonTypes.ContentTab.CURRENT_PLAYLIST }) })
  expect(screen.getByRole('button', { name: 'CurrentPlaylist draft 1' })).not.toBeNull()
  expect(mounts).toEqual(new Map([['General', 1], ['CurrentPlaylist', 1]]))
})

it('updates only the affected track rows for playback changes and keeps queue metadata separate', async () => {
  const source = playlist(['1_1', '1_2', '1_3'])
  const browser = createChrome({ userId: '1', currentPlaylist: source, activeTrack: track('1_1'), played: false })
  vi.resetModules()
  const renders: string[] = []
  vi.doMock('@/entities/track', async importOriginal => ({
    ...await importOriginal<typeof import('@/entities/track')>(),
    TrackCell: ({ title, trackState }: { title: string, trackState: string }) => {
      renders.push(title)
      return createElement('span', {}, `${title} ${trackState}`)
    }
  }))
  const { Track } = await import('@/widgets/track-list')
  render(createElement('div', {}, source.tracks.map(item => createElement(Track, { key: item.id, track: item, playlist: source }))))
  await screen.findByText('1_1 paused')
  renders.length = 0
  await act(async () => { await browser.api.storage.local.set({ played: true }) })
  expect(renders).toEqual(['1_1'])
  expect(screen.getByText('1_1 played')).not.toBeNull()
  renders.length = 0
  await act(async () => { await browser.api.storage.local.set({ activeTrack: track('1_2') }) })
  expect(renders.sort()).toEqual(['1_1', '1_2'])
  renders.length = 0
  await act(async () => { await browser.api.storage.local.set({ currentPlaylist: { ...source, nextOffset: 'next' }, currentTime: 10 }) })
  expect(renders).toEqual([])
  await act(async () => { await browser.api.storage.local.set({ currentPlaylist: null }) })
  await waitFor(() => { expect(renders.sort()).toEqual(['1_1', '1_2', '1_3']) })
})

it('retargets a playback observer when the track identity changes', async () => {
  const browser = createChrome({ activeTrack: track('1_1'), played: true })
  vi.resetModules()
  const { useTrackPlayback } = await import('@/entities/active-track')
  const Probe = ({ id }: { id: string }) => createElement('span', {}, useTrackPlayback(id) ?? 'inactive')
  const view = render(createElement(Probe, { id: '1_1' }))
  await screen.findByText('played')
  view.rerender(createElement(Probe, { id: '2_2' }))
  expect(screen.getByText('inactive')).not.toBeNull()
  await act(async () => { await browser.api.storage.local.set({ activeTrack: track('2_2'), played: false }) })
  expect(screen.getByText('paused')).not.toBeNull()
})

it('updates playlist and Mix controls only when their own playback state changes', async () => {
  const first = playlist(['1_1'], 'first')
  const second = playlist(['1_2'], 'second')
  const mix = { ...playlist([], 'mix'), isVkMix: true, mixId: 'artist_mix', mixOptions: 'options', mixEntityId: 'artist' }
  const browser = createChrome({ currentPlaylist: first, played: false })
  const { usePlaylistPlayback, useMixPlayback } = await import('@/entities/active-track')
  const renders: string[] = []
  const PlaylistProbe = ({ source }: { source: typeof first }) => {
    const value = usePlaylistPlayback(source)
    renders.push(source.id)
    return createElement('span', {}, `${source.id}: ${value}`)
  }
  const MixProbe = () => {
    const value = useMixPlayback('artist_mix', 'options', 'artist')
    renders.push('mix')
    return createElement('span', {}, `mix: ${value}`)
  }
  render(createElement('div', {}, createElement(PlaylistProbe, { source: first }), createElement(PlaylistProbe, { source: second }), createElement(MixProbe)))
  await screen.findByText('first: paused')
  renders.length = 0
  await act(async () => { await browser.api.storage.local.set({ played: true }) })
  expect(renders).toEqual(['first'])
  renders.length = 0
  await act(async () => { await browser.api.storage.local.set({ currentPlaylist: { ...first, nextOffset: 'next', tracks: [...first.tracks] }, activeTrack: track('1_2'), currentTime: 10 }) })
  expect(renders).toEqual([])
  await act(async () => { await browser.api.storage.local.set({ playbackSelection: mix, playbackRequested: true }) })
  expect(screen.getByText('mix: played')).not.toBeNull()
  expect(renders).toEqual(['mix'])
  renders.length = 0
  await act(async () => { await browser.api.storage.local.set({ playbackSelection: { ...mix, mixEntityId: 'other' } }) })
  expect(screen.getByText('mix: null')).not.toBeNull()
  expect(renders).toEqual(['mix'])
  await act(async () => { await browser.api.storage.local.set({ currentPlaylist: second, playbackRequested: false }) })
  expect(screen.getByText('first: null')).not.toBeNull()
  expect(screen.getByText('second: paused')).not.toBeNull()
})

it('keeps unrelated radio stations out of playback renders while preserving their controls', async () => {
  vi.stubGlobal('ResizeObserver', class { observe () {} unobserve () {} disconnect () {} })
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
  const browser = createChrome({ activeTrack: track('1_1'), played: false })
  browser.api.runtime.onMessage.addListener(() => {})
  const renders: string[] = []
  vi.doMock('@/entities/track', async importOriginal => {
    const original = await importOriginal<typeof import('@/entities/track')>()
    return {
      ...original,
      getTrackState: (...args: Parameters<typeof original.getTrackState>) => {
        renders.push(args[0].id)
        return original.getTrackState(...args)
      }
    }
  })
  const { CatalogGallery } = await import('@/widgets/catalog-gallery')
  const { CatalogBlockDataType } = await import('@/shared/types')
  const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query')
  const { ConfigProvider, AdaptivityProvider, Platform } = await import('@vkontakte/vkui')
  const stations = { ...playlist(['radio_1', 'radio_2', 'radio_3']), isRadio: true }
  render(createElement(QueryClientProvider, { client: new QueryClient(), children: createElement(ConfigProvider, { platform: Platform.ANDROID, children: createElement(AdaptivityProvider, { children: createElement(CatalogGallery, { userId: '1', mode: 'card', isPending: false, loadingBlock: 'tracks', catalogBlock: { dataType: CatalogBlockDataType.TRACKS, blockId: 'radio', playlist: stations } }) }) }) }))
  await act(async () => { await browser.api.storage.local.get() })
  renders.length = 0
  await act(async () => { await browser.api.storage.local.set({ played: true }) })
  expect(renders).toEqual([])
  await act(async () => { await browser.api.storage.local.set({ activeTrack: track('radio_1') }) })
  expect(renders).toEqual(['radio_1'])
  renders.length = 0
  await act(async () => { await browser.api.storage.local.set({ activeTrack: track('radio_2') }) })
  expect(renders.sort()).toEqual(['radio_1', 'radio_2'])
  expect(screen.getByRole('button', { name: 'Слушать: radio_1' })).not.toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Приостановить: radio_2' }))
  expect(browser.api.runtime.sendMessage).toHaveBeenLastCalledWith({ target: 'service-worker', type: 'toggle-playback' })
})

it('isolates playback updates in retained listening cards to the affected preview tracks', async () => {
  vi.stubGlobal('ResizeObserver', class { observe () {} unobserve () {} disconnect () {} })
  vi.stubGlobal('matchMedia', vi.fn((media: string) => ({ matches: false, media, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
  const browser = createChrome({ activeTrack: track('9_1'), played: false })
  browser.api.runtime.onMessage.addListener(() => {})
  const renders: string[] = []
  vi.doMock('@/entities/track', async importOriginal => {
    const original = await importOriginal<typeof import('@/entities/track')>()
    return {
      ...original,
      getTrackState: (...args: Parameters<typeof original.getTrackState>) => {
        renders.push(args[0].id)
        return original.getTrackState(...args)
      }
    }
  })
  const { CatalogGallery } = await import('@/widgets/catalog-gallery')
  const { CatalogBlockDataType } = await import('@/shared/types')
  const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query')
  const { ConfigProvider, AdaptivityProvider, Platform } = await import('@vkontakte/vkui')
  const albums = Array.from({ length: 10 }, (_, index) => ({
    ...playlist([`1_${index * 3 + 1}`, `1_${index * 3 + 2}`, `1_${index * 3 + 3}`], `album-${index}`),
    coverUrl: '',
    gridCoverUrls: [],
    authorLine: '',
    authorName: '',
    infoLine: ''
  }))
  const client = new QueryClient()
  const view = render(createElement(QueryClientProvider, {
    client,
    children: createElement(ConfigProvider, {
      platform: Platform.ANDROID,
      children: createElement(AdaptivityProvider, {
        children: createElement('div', { hidden: true, inert: true }, createElement(CatalogGallery, {
          userId: '1', mode: 'card', isPending: false, loadingBlock: 'albums', catalogBlock: { dataType: CatalogBlockDataType.ALBUMS, blockId: 'listening', title: 'Слушайте друг друга', showAllLink: '', albums }
        }))
      })
    })
  }))
  await act(async () => { await browser.api.storage.local.get() })
  renders.length = 0
  await act(async () => { await browser.api.storage.local.set({ played: true, currentTime: 10 }) })
  expect(renders).toEqual([])
  await act(async () => { await browser.api.storage.local.set({ activeTrack: track('9_2') }) })
  expect(renders).toEqual([])
  await act(async () => { await browser.api.storage.local.set({ activeTrack: track('1_1') }) })
  expect(renders).toEqual(['1_1'])
  renders.length = 0
  await act(async () => { await browser.api.storage.local.set({ activeTrack: track('1_2') }) })
  expect(renders.sort()).toEqual(['1_1', '1_2'])
  fireEvent.click(Array.from(view.container.querySelectorAll<HTMLButtonElement>('.vkap_listening_track')).find(button => button.textContent?.includes('1_2'))!)
  expect(browser.api.runtime.sendMessage).toHaveBeenLastCalledWith({ target: 'service-worker', type: 'toggle-playback' })
  client.clear()
})

it.each([false, true])('expires restoration after navigation for an isolated row, late deletion %s', async late => {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
  vi.stubGlobal('ResizeObserver', class { observe () {} unobserve () {} disconnect () {} })
  const source = playlist(['1_1'])
  const browser = createChrome({ userId: '1', currentPlaylist: source, activeTab: { tab: 'general' } })
  browser.api.runtime.onMessage.addListener(() => {})
  vi.resetModules()
  const { deferred } = await import('../helpers/deferred')
  const deletion = deferred<void>()
  vi.doMock('@/entities/track', async importOriginal => ({
    ...await importOriginal<typeof import('@/entities/track')>(),
    TrackCell: ({ title, actions }: { title: string, actions: React.ReactNode }) => createElement('div', { 'data-testid': 'row' }, title, actions)
  }))
  vi.doMock('@/features/delete-from-my-music', () => ({
    DeleteFromMyMusicButton: () => null,
    DeleteFromMyMusicWithRestoreButton: ({ onBeforeDelete, onAfterDelete }: { onBeforeDelete?: () => void, onAfterDelete: () => void }) => createElement('button', { onClick: async () => { onBeforeDelete?.(); await deletion.promise; onAfterDelete() } }, 'Delete')
  }))
  const { Track } = await import('@/widgets/track-list')
  const { commonTypes } = await import('@vk-audiopad/common')
  const { setActiveTab } = await import('@/shared/model')
  render(createElement(Track, { track: source.tracks[0], playlist: source }))
  await screen.findByRole('button', { name: 'Delete' })
  // The row survives earlier navigation without a playback or source update.
  await act(async () => { setActiveTab({ tab: commonTypes.ContentTab.EXPLORE }) })
  await act(async () => { setActiveTab({ tab: commonTypes.ContentTab.GENERAL }) })
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
  if (late) await act(async () => { setActiveTab({ tab: commonTypes.ContentTab.RADIO }) })
  await act(async () => { deletion.resolve() })
  if (!late) {
    expect(screen.getByRole('button', { name: 'Восстановить аудиозапись' })).not.toBeNull()
    await act(async () => { setActiveTab({ tab: commonTypes.ContentTab.RADIO }) })
  }
  expect(screen.queryByTestId('row')).toBeNull()
  expect(browser.api.runtime.sendMessage).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ type: commonTypes.MessageType.DELETE_TRACK, track: source.tracks[0] }))
})

it('keeps row metadata and non-queue actions out of playback-only renders', async () => {
  vi.stubGlobal('ResizeObserver', class { observe () {} unobserve () {} disconnect () {} })
  vi.stubGlobal('matchMedia', vi.fn((media: string) => ({ matches: false, media, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
  const source = playlist(['1_1', '1_2', '1_3'])
  const browser = createChrome({ userId: '1', currentPlaylist: source, activeTrack: source.tracks[0], played: false, playbackRequested: true })
  const artists: string[] = []
  const actions: string[] = []
  vi.doMock('@/features/search-artist', () => ({ SearchArtist: ({ track }: { track: { id: string } }) => { artists.push(track.id); return createElement('span', {}, track.id) } }))
  vi.doMock('@/features/similar', () => ({ SimilarButton: ({ track }: { track: { id: string } }) => { actions.push(track.id); return createElement('button', {}, 'Similar ' + track.id) } }))
  const { Track } = await import('@/widgets/track-list')
  const { ConfigProvider, AdaptivityProvider } = await import('@vkontakte/vkui')
  render(createElement(ConfigProvider, { children: createElement(AdaptivityProvider, { children: source.tracks.map(item => createElement(Track, { key: item.id, track: item, playlist: source })) }) }))
  await act(async () => { await browser.api.storage.local.get() })
  artists.length = 0
  actions.length = 0
  await act(async () => { await browser.api.storage.local.set({ played: true }) })
  await act(async () => { await browser.api.storage.local.set({ played: false, activeTrack: source.tracks[1] }) })
  await act(async () => { await browser.api.storage.local.set({ played: true, currentTime: 1 }) })
  expect(artists).toEqual([])
  expect(actions).toEqual([])
  expect(screen.getByRole('button', { name: 'Приостановить 1_2' })).not.toBeNull()
})

it('observes requested playback without rerendering on media acknowledgements', async () => {
  const browser = createChrome({ played: false, playbackRequested: true })
  const { usePlaybackRequested } = await import('@/entities/active-track')
  const renders: boolean[] = []
  const Probe = () => { const requested = usePlaybackRequested(); renders.push(requested); return createElement('span', {}, String(requested)) }
  render(createElement(Probe))
  await act(async () => { await browser.api.storage.local.get() })
  renders.length = 0
  await act(async () => { await browser.api.storage.local.set({ played: true }) })
  await act(async () => { await browser.api.storage.local.set({ played: false }) })
  expect(renders).toEqual([])
  await act(async () => { await browser.api.storage.local.set({ playbackRequested: false }) })
  expect(renders).toEqual([false])
  await act(async () => { await browser.api.storage.local.remove('playbackRequested') })
  await act(async () => { await browser.api.storage.local.set({ played: true }) })
  expect(renders.at(-1)).toBe(true)
})

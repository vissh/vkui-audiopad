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

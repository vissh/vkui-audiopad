// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { type commonTypes } from '@vk-audiopad/common'
import { createChrome } from '../helpers/chrome'
import { deferred } from '../helpers/deferred'
import { playlist } from '../helpers/playback'

beforeEach(() => {
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
})
afterEach(() => { cleanup(); vi.doUnmock('@/shared/api') })

const setup = async (currentPlaylist?: commonTypes.Playlist) => {
  const browser = createChrome({ userId: '1', currentPlaylist, playbackRequested: currentPlaylist != null, played: false })
  browser.api.runtime.onMessage.addListener(() => {})
  const album = { ...playlist([], 'recommendation'), title: 'Для вас', coverUrl: '', gridCoverUrls: [], authorLine: 'Tracks for you', authorName: '', infoLine: '' }
  const loaded = { ...album, tracks: playlist(['1_1', '1_2']).tracks }
  const response = deferred<{ playlist: commonTypes.Playlist }>()
  const fetchPlaylist = vi.fn(async (_args: unknown, _signal?: AbortSignal) => await response.promise)
  vi.doMock('@/shared/api', () => ({ fetchPlaylist }))
  const { ConfigProvider, AdaptivityProvider, Platform } = await import('@vkontakte/vkui')
  const { RecommendedGallery } = await import('@/widgets/recommended-gallery')
  const { Notification } = await import('@/shared/ui/notification')
  const view = render(createElement(ConfigProvider, {
    platform: Platform.ANDROID,
    children: createElement(AdaptivityProvider, {},
      createElement(RecommendedGallery, { isPending: false, title: 'Собрано алгоритмами', userId: '1', albums: [album, { ...album, id: 'second', blockId: 'second', title: 'Открытия' }] }), createElement(Notification))
  }))
  await act(async () => { await browser.api.storage.local.get() })
  browser.api.storage.local.set.mockClear()
  return { ...browser, ...view, album, loaded, response, fetchPlaylist }
}

it('starts the recommendation from its card without navigating, preserving focus and blocking duplicate loads', async () => {
  const page = await setup()
  const button = screen.getByRole('button', { name: 'Воспроизвести: Для вас' })
  button.focus()
  fireEvent.click(button)
  fireEvent.click(button)
  expect(page.fetchPlaylist).toHaveBeenCalledOnce()
  expect(page.fetchPlaylist).toHaveBeenCalledWith({ fromId: '1', playlist: page.album }, expect.any(AbortSignal))
  expect(button.getAttribute('aria-busy')).toBe('true')
  expect(document.activeElement).toBe(button)
  expect(page.api.storage.local.set).not.toHaveBeenCalled()
  await act(async () => { page.response.resolve({ playlist: page.loaded }) })
  const { commonTypes } = await import('@vk-audiopad/common')
  expect(page.api.runtime.sendMessage).toHaveBeenCalledExactlyOnceWith({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.ACTIVE_TRACK, trackId: null, playlist: page.loaded })
  expect(button.getAttribute('aria-busy')).toBeNull()
  expect(document.activeElement).toBe(button)
  expect(page.api.storage.local.set).not.toHaveBeenCalled()
  fireEvent.click(screen.getByText('Для вас'))
  await waitFor(() => { expect(page.snapshot().activeTab).toMatchObject({ tab: 'playlist', fromId: '1', playlist: { id: page.album.id } }) })
})

it('keeps accessible play/pause names without showing a hover or focus tooltip', async () => {
  const page = await setup()
  const button = screen.getByRole('button', { name: 'Воспроизвести: Для вас' })
  act(() => { button.focus() })
  fireEvent.mouseOver(button)
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 200)) })
  expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull()
  expect(button.getAttribute('title')).toBeNull()
  await act(async () => { await page.api.storage.local.set({ currentPlaylist: page.loaded, playbackRequested: true }) })
  expect(screen.getByRole('button', { name: 'Приостановить: Для вас' })).toBe(button)
  expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull()
})

it('does not draw a background layer behind the glyph on hover or press', async () => {
  const page = await setup()
  const button = screen.getByRole('button', { name: 'Воспроизвести: Для вас' })
  fireEvent.pointerEnter(button)
  fireEvent.pointerDown(button, { pointerId: 1 })
  expect(button.querySelector('.vkuiTappable__stateLayer')).toBeNull()
  fireEvent.pointerUp(button, { pointerId: 1 })
  await act(async () => { await page.api.storage.local.set({ currentPlaylist: page.loaded, playbackRequested: true }) })
  expect(screen.getByRole('button', { name: 'Приостановить: Для вас' })).toBe(button)
  expect(button.querySelector('.vkuiTappable__stateLayer')).toBeNull()
  expect(page.api.runtime.sendMessage).not.toHaveBeenCalled()
})

it('pauses and resumes the active recommendation through shared intent without fetching again', async () => {
  const page = await setup({ ...playlist(['1_1'], 'recommendation') })
  fireEvent.click(screen.getByRole('button', { name: 'Приостановить: Для вас' }))
  await act(async () => { await page.api.storage.local.set({ playbackRequested: false }) })
  fireEvent.click(screen.getByRole('button', { name: 'Воспроизвести: Для вас' }))
  const { commonTypes } = await import('@vk-audiopad/common')
  expect(page.api.runtime.sendMessage).toHaveBeenCalledTimes(2)
  expect(page.api.runtime.sendMessage).toHaveBeenLastCalledWith({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.TOGGLE_PLAYBACK })
  expect(page.fetchPlaylist).not.toHaveBeenCalled()
})

it('does not toggle a different owner with the same playlist ID', async () => {
  const page = await setup({ ...playlist(['2_1'], 'recommendation'), ownerId: '2' })
  fireEvent.click(screen.getByRole('button', { name: 'Воспроизвести: Для вас' }))
  expect(page.fetchPlaylist).toHaveBeenCalledOnce()
  expect(page.api.runtime.sendMessage).not.toHaveBeenCalled()
  await act(async () => { page.response.resolve({ playlist: page.loaded }) })
})

it.each(['failed', 'empty'] as const)('shows safe feedback for a %s load and allows explicit retry', async outcome => {
  const page = await setup()
  const button = screen.getByRole('button', { name: 'Воспроизвести: Для вас' })
  fireEvent.click(button)
  await act(async () => {
    if (outcome === 'failed') page.response.reject(new Error('synthetic-private-value'))
    else page.response.resolve({ playlist: page.album })
  })
  await screen.findByText('Не удалось запустить подборку. Повторите попытку')
  expect(screen.queryByText(/synthetic-private-value/)).toBeNull()
  expect(button.getAttribute('aria-busy')).toBeNull()
  expect(page.api.runtime.sendMessage).not.toHaveBeenCalled()
  page.fetchPlaylist.mockResolvedValueOnce({ playlist: page.loaded })
  fireEvent.click(button)
  await waitFor(() => { expect(page.api.runtime.sendMessage).toHaveBeenCalledOnce() })
})

it('cancels a pending card load on unmount and ignores its late completion', async () => {
  const page = await setup()
  fireEvent.click(screen.getByRole('button', { name: 'Воспроизвести: Для вас' }))
  const signal = page.fetchPlaylist.mock.calls[0]?.[1]
  page.unmount()
  expect(signal?.aborted).toBe(true)
  await act(async () => { page.response.resolve({ playlist: page.loaded }) })
  expect(page.api.runtime.sendMessage).not.toHaveBeenCalled()
  expect(page.api.storage.local.set).not.toHaveBeenCalled()
})

it('keeps the latest card selection when two playlist loads finish out of order', async () => {
  const page = await setup()
  const second = deferred<{ playlist: commonTypes.Playlist }>()
  page.fetchPlaylist.mockReturnValueOnce(page.response.promise).mockReturnValueOnce(second.promise)
  fireEvent.click(screen.getByRole('button', { name: 'Воспроизвести: Для вас' }))
  fireEvent.click(screen.getByRole('button', { name: 'Воспроизвести: Открытия' }))
  expect(page.fetchPlaylist.mock.calls[0]?.[1]?.aborted).toBe(true)
  const newer = { ...page.loaded, id: 'second', blockId: 'second' }
  await act(async () => { second.resolve({ playlist: newer }) })
  await act(async () => { page.response.resolve({ playlist: page.loaded }) })
  expect(page.api.runtime.sendMessage).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ type: 'active-track', playlist: newer }))
})

// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen, within } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { clearPlaybackMocks, playbackHarness, playlist, track } from '../helpers/playback'
import { deferred } from '../helpers/deferred'
import { type commonTypes } from '@vk-audiopad/common'

beforeEach(() => {
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: () => true
  })))
})

afterEach(cleanup)
afterEach(clearPlaybackMocks)

const renderWithVKUI = async (children: ReactNode) => {
  const { ConfigProvider, AdaptivityProvider, Platform } = await import('@vkontakte/vkui')
  return render(createElement(ConfigProvider, {
    platform: Platform.ANDROID,
    children: createElement(AdaptivityProvider, { children })
  }))
}

it('sends toggles without deriving intent from delayed media state', async () => {
  const browser = createChrome({ played: false, playbackError: null })
  const commands = vi.fn()
  browser.api.runtime.onMessage.addListener(message => commands(message))
  const { usePlayed, usePlaybackError } = await import('@/entities/active-track')
  const { PlayPauseButton } = await import('@/features/play-or-pause')
  const { commonTypes } = await import('@vk-audiopad/common')
  const { result } = renderHook(() => ({ played: usePlayed(), error: usePlaybackError() }))
  await renderWithVKUI(createElement(PlayPauseButton))
  await act(async () => { await browser.api.storage.local.get() })
  fireEvent.click(screen.getByRole('button'))
  expect(commands).toHaveBeenLastCalledWith({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.TOGGLE_PLAYBACK })
  expect(browser.api.storage.local.set).not.toHaveBeenCalled()
  expect(result.current.played).toBe(false)
  fireEvent.click(screen.getByRole('button'))
  expect(commands).toHaveBeenCalledTimes(2)
  expect(commands).toHaveBeenLastCalledWith({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.TOGGLE_PLAYBACK })
  await act(async () => { await browser.api.storage.local.set({ played: true }) })
  expect(result.current.played).toBe(true)
  browser.api.storage.local.set.mockClear()
  fireEvent.click(screen.getByRole('button'))
  expect(commands).toHaveBeenLastCalledWith({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.TOGGLE_PLAYBACK })
  expect(browser.api.storage.local.set).not.toHaveBeenCalled()
  await act(async () => { await browser.api.storage.local.set({ played: false, playbackError: 'Нет доступных треков' }) })
  expect(result.current).toEqual({ played: false, error: 'Нет доступных треков' })
})

it('shows the pause action during loading while keeping observed playback false', async () => {
  const browser = createChrome({ played: false })
  const { usePlayed } = await import('@/entities/active-track')
  const { PlayPauseButton } = await import('@/features/play-or-pause')
  const { result } = renderHook(usePlayed)
  await renderWithVKUI(createElement(PlayPauseButton))
  await act(async () => { await browser.api.storage.local.get() })
  expect(screen.getByRole('button', { name: 'Воспроизвести' })).toBeTruthy()
  await act(async () => { await browser.api.storage.local.set({ playbackRequested: true }) })
  expect(screen.getByRole('button', { name: 'Приостановить' })).toBeTruthy()
  expect(result.current).toBe(false)
  await act(async () => { await browser.api.storage.local.set({ playbackRequested: false }) })
  expect(screen.getByRole('button', { name: 'Воспроизвести' })).toBeTruthy()
})

it('cancels a delayed header play from the album control before media starts', async () => {
  const queue = playlist(['1_1'])
  const player = await playbackHarness({ activeTrack: track('1_1'), currentPlaylist: queue })
  const response = deferred<commonTypes.TrackItem | null>()
  player.fetchTrack.mockReturnValueOnce(response.promise)
  const { commonTypes } = await import('@vk-audiopad/common')
  const { startListeningMessages } = await import('../../packages/service-worker/src/listeners/messages')
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"offscreen-document-support":true}')))
  const { immediateReadiness } = await import('../../packages/service-worker/src/readiness')
  await startListeningMessages(immediateReadiness, true)
  const { PlayPauseButton } = await import('@/features/play-or-pause')
  const { PlayPauseIcon } = await import('@/features/play-or-pause-album')
  const album = { ...queue, coverUrl: '', gridCoverUrls: [], authorLine: '', authorName: '', infoLine: '' }
  await renderWithVKUI(createElement('div', {
    children: [
      createElement(PlayPauseButton, { key: 'header' }),
      createElement('div', { key: 'album', 'data-testid': 'album', children: createElement(PlayPauseIcon, { album, onPlayNewAlbum: vi.fn() }) })
    ]
  }))
  await act(async () => { await player.api.storage.local.get() })
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Воспроизвести' }))
    await vi.waitFor(() => { expect(player.fetchTrack).toHaveBeenCalledOnce() })
  })
  expect(screen.getByRole('button', { name: 'Приостановить' })).toBeTruthy()
  await act(async () => {
    fireEvent.click(screen.getByTestId('album').querySelector('svg')!)
    await vi.waitFor(() => { expect(player.snapshot()).toMatchObject({ playbackRequested: false }) })
    response.resolve(track('1_1'))
    const { getPlaybackOperation } = await import('../../packages/service-worker/src/playback-operation')
    await vi.waitFor(() => { expect(getPlaybackOperation()?.loading).toBe(false) })
  })
  expect(player.play).not.toHaveBeenCalled()
  expect(player.snapshot()).toMatchObject({ played: false, playbackRequested: false, playbackError: null })
  expect(screen.getByRole('button', { name: 'Воспроизвести' })).toBeTruthy()
  expect(player.api.runtime.sendMessage).toHaveBeenCalledTimes(2)
  expect(player.api.runtime.sendMessage).toHaveBeenLastCalledWith({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.TOGGLE_PLAYBACK })
})

it.each(['played', 'paused'] as const)('sends an explicit command for a %s track row', async trackState => {
  const browser = createChrome()
  const commands = vi.fn()
  browser.api.runtime.onMessage.addListener(message => commands(message))
  const { playOrPause } = await import('@/features/play-or-pause')
  const { commonTypes } = await import('@vk-audiopad/common')
  playOrPause(trackState, '1_1', playlist(['1_1']))
  expect(commands).toHaveBeenCalledExactlyOnceWith({
    target: commonTypes.MessageTarget.SERVICE_WORKER,
    type: commonTypes.MessageType.TOGGLE_PLAYBACK
  })
  expect(browser.api.storage.local.set).not.toHaveBeenCalled()
})

it('keeps selecting a different track as an ACTIVE_TRACK command', async () => {
  const browser = createChrome()
  const commands = vi.fn()
  browser.api.runtime.onMessage.addListener(message => commands(message))
  const { playOrPause } = await import('@/features/play-or-pause')
  const { commonTypes } = await import('@vk-audiopad/common')
  const queue = playlist(['1_1'])
  playOrPause('normal', '1_1', queue)
  expect(commands).toHaveBeenCalledExactlyOnceWith({
    target: commonTypes.MessageTarget.SERVICE_WORKER,
    type: commonTypes.MessageType.ACTIVE_TRACK,
    trackId: '1_1',
    playlist: queue
  })
})

it('sends pause from the active album without triggering the parent card', async () => {
  const queue = playlist(['1_1'])
  const browser = createChrome({ played: true, currentPlaylist: queue })
  const commands = vi.fn()
  browser.api.runtime.onMessage.addListener(message => commands(message))
  const { PlayPauseIcon } = await import('@/features/play-or-pause-album')
  const { commonTypes } = await import('@vk-audiopad/common')
  const onParentClick = vi.fn()
  const onPlayNewAlbum = vi.fn()
  const album = { ...queue, coverUrl: '', gridCoverUrls: [], authorLine: '', authorName: '', infoLine: '' }
  const { container } = await renderWithVKUI(createElement('div', {
    onClick: onParentClick,
    children: createElement(PlayPauseIcon, { album, onPlayNewAlbum })
  }))
  await act(async () => { await browser.api.storage.local.get() })
  const icon = container.querySelector('svg')
  expect(icon).not.toBeNull()
  fireEvent.click(icon!)
  expect(commands).toHaveBeenCalledExactlyOnceWith({
    target: commonTypes.MessageTarget.SERVICE_WORKER,
    type: commonTypes.MessageType.TOGGLE_PLAYBACK
  })
  expect(onParentClick).not.toHaveBeenCalled()
  expect(onPlayNewAlbum).not.toHaveBeenCalled()
  expect(browser.api.storage.local.set).not.toHaveBeenCalled()
})

it('pauses the active VK Mix through the playback feature', async () => {
  const browser = createChrome({ played: true, currentPlaylist: { ...playlist(['1_1']), isVkMix: true } })
  const commands = vi.fn()
  browser.api.runtime.onMessage.addListener(message => commands(message))
  const { VKMixButton } = await import('../../packages/front/src/widgets/vk-mix/ui/VKMixButton')
  const { commonTypes } = await import('@vk-audiopad/common')
  await renderWithVKUI(createElement(VKMixButton))
  await act(async () => { await browser.api.storage.local.get() })
  fireEvent.click(screen.getByRole('button'))
  expect(commands).toHaveBeenCalledExactlyOnceWith({
    target: commonTypes.MessageTarget.SERVICE_WORKER,
    type: commonTypes.MessageType.TOGGLE_PLAYBACK
  })
  expect(browser.api.storage.local.set).not.toHaveBeenCalled()
})

it('shows a terminal playback error in the actual player', async () => {
  const browser = createChrome({ played: false, playbackError: 'Нет доступных треков' })
  const { Player } = await import('@/widgets/player')
  await renderWithVKUI(createElement(Player))
  await act(async () => { await browser.api.storage.local.get() })
  expect(screen.getByRole('status').textContent).toContain('Нет доступных треков')
  await act(async () => { await browser.api.storage.local.set({ playbackError: null }) })
  expect(screen.queryByRole('status')).toBeNull()
})

it('retries explicitly and dismisses feedback without changing playback storage', async () => {
  const browser = createChrome({ played: false, playbackError: 'Не удалось запустить 5 треков подряд.' })
  const commands = vi.fn()
  browser.api.runtime.onMessage.addListener(message => commands(message))
  const { commonTypes } = await import('@vk-audiopad/common')
  const { Player } = await import('@/widgets/player')
  await renderWithVKUI(createElement(Player))
  await act(async () => { await browser.api.storage.local.get() })
  browser.api.storage.local.set.mockClear()
  fireEvent.click(screen.getByRole('button', { name: 'Попробовать снова' }))
  expect(commands).toHaveBeenCalledExactlyOnceWith({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.PLAY_OR_PAUSE, played: true })
  expect(browser.api.storage.local.set).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Скрыть сообщение' }))
  expect(screen.queryByRole('status')).toBeNull()
  expect(browser.api.storage.local.set).not.toHaveBeenCalled()
  await act(async () => { await browser.api.storage.local.set({ playbackError: null }) })
  await act(async () => { await browser.api.storage.local.set({ playbackError: 'Не удалось запустить 5 треков подряд.' }) })
  expect(screen.getByRole('status')).toBeTruthy()
})

it('keeps initialization restart guidance without an ineffective playback retry', async () => {
  const browser = createChrome({ playbackInitialization: 'failed', playbackError: 'Перезапустите расширение.' })
  const { Player } = await import('@/widgets/player')
  await renderWithVKUI(createElement(Player))
  await act(async () => { await browser.api.storage.local.get() })
  expect(screen.getByRole('status').textContent).toContain('Перезапустите расширение.')
  expect(screen.queryByRole('button', { name: 'Попробовать снова' })).toBeNull()
})

it('starts a fresh track Mix from either button size with the original track identity', async () => {
  const browser = createChrome({ userId: '1' })
  const commands = vi.fn()
  browser.api.runtime.onMessage.addListener(message => commands(message))
  const { TrackMixButton } = await import('@/features/track-mix')
  const source = track('-2_20')
  await renderWithVKUI(createElement('div', {}, createElement(TrackMixButton, { track: source, size: 's' }), createElement(TrackMixButton, { track: source })))
  await act(async () => { await browser.api.storage.local.get() })
  for (const button of screen.getAllByRole('button', { name: 'Микс по треку' })) fireEvent.click(button)
  expect(commands).toHaveBeenCalledTimes(2)
  expect(commands).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'active-track', trackId: null, playlist: expect.objectContaining({ mixId: 'track_mix', mixEntityId: '-2_20', isVkMix: true, tracks: [] }) }))
  expect(browser.api.storage.local.set).not.toHaveBeenCalled()
})

it('groups player actions in reading order and labels transport and sliders', async () => {
  const { commonTypes } = await import('@vk-audiopad/common')
  const source = { ...track('-2_20'), flags: commonTypes.TrackFlagBit.CAN_ADD | commonTypes.TrackFlagBit.HAS_LYRICS }
  const browser = createChrome({ userId: '1', activeTrack: source, currentPlaylist: playlist([source.id]) })
  browser.api.runtime.onMessage.addListener(() => {})
  const { Player } = await import('@/widgets/player')
  const view = await renderWithVKUI(createElement(Player))
  await act(async () => { await browser.api.storage.local.get() })
  const names = (name: string) => within(screen.getByRole('group', { name })).getAllByRole('button').map(button => button.getAttribute('aria-label') ?? button.textContent)
  expect(names('Воспроизведение')).toEqual(['Предыдущий трек', 'Воспроизвести', 'Следующий трек'])
  expect(names('Рекомендации и текст')).toEqual(['Микс по треку', 'Показать похожие', 'Показать текст'])
  expect(names('Сохранение трека')).toEqual(['Добавить в мою музыку', 'Добавить в плейлист'])
  expect(names('Режимы воспроизведения')).toEqual(['Перемешать', 'Повторять'])
  expect([...view.container.querySelectorAll('.vkap_player_leading button')].map(button => button.getAttribute('aria-label') ?? button.textContent)).toEqual(['Предыдущий трек', 'Воспроизвести', 'Следующий трек', 'Перемешать', 'Повторять'])
  expect(view.container.querySelector('.vkap_player_track_row .vkap_player_track_info')).not.toBeNull()
  expect(view.container.querySelector('.vkap_player_track_row .vkap_player_track_actions')).not.toBeNull()
  expect(view.container.querySelector('.vkap_player_time button')).not.toBeNull()
  const style = document.createElement('style')
  style.textContent = readFileSync('packages/front/src/widgets/player/ui/Player.css', 'utf8')
  document.head.append(style)
  try {
    const time = within(screen.getByRole('button', { name: '0:00' })).getByText('0:00')
    expect(getComputedStyle(time).fontSize).toBe('11px')
    expect(getComputedStyle(time).lineHeight).toBe('14px')
  } finally {
    style.remove()
  }
  expect(screen.getByRole('button', { name: 'Выключить звук' })).toBeTruthy()
  expect(screen.getByRole('slider', { name: 'Громкость' })).toBeTruthy()
  expect(screen.getByRole('slider', { name: 'Позиция воспроизведения' })).toBeTruthy()
  expect([...view.container.querySelectorAll('button')].every(button => Boolean(button.getAttribute('aria-label') || button.textContent))).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Предыдущий трек' }))
  fireEvent.click(screen.getByRole('button', { name: 'Следующий трек' }))
  expect(browser.api.runtime.sendMessage).toHaveBeenNthCalledWith(1, expect.objectContaining({ type: commonTypes.MessageType.PREVIOUS_TRACK }))
  expect(browser.api.runtime.sendMessage).toHaveBeenNthCalledWith(2, expect.objectContaining({ type: commonTypes.MessageType.NEXT_TRACK }))
})

it.each(['1_1', '-2_20'])('keeps queue, discovery and saving actions ordered on track %s', async id => {
  const browser = createChrome({ userId: '1', activeTrack: track('1_99'), currentPlaylist: playlist([id]) })
  const { Track } = await import('@/widgets/track-list')
  const view = await renderWithVKUI(createElement(Track, { playlist: playlist([id]), track: track(id) }))
  await act(async () => { await browser.api.storage.local.get() })
  const actions = [...view.container.querySelectorAll('.vkap_track_cell_actions button')].map(button => button.getAttribute('aria-label') ?? button.textContent)
  expect(actions).toEqual(['Воспроизвести следующей', 'Микс по треку', 'Показать похожие', 'Добавить в плейлист', id === '1_1' ? 'Удалить из моей музыки' : 'Добавить в мою музыку'])
})

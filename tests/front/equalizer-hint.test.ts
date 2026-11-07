// @vitest-environment jsdom
import { equalizer } from '@vk-audiopad/common'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'

afterEach(cleanup)
beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('ResizeObserver', class { observe () {} unobserve () {} disconnect () {} })
  vi.stubGlobal('matchMedia', vi.fn((media: string) => ({ matches: false, media, addListener () {}, removeListener () {}, addEventListener () {}, removeEventListener () {} })))
})

const mount = async (copies = 1, settle = true) => {
  const { ConfigProvider, AdaptivityProvider, AppRoot, Platform } = await import('@vkontakte/vkui')
  const { ActionTabs } = await import('../../packages/front/src/widgets/navigation/ui/ActionTabs')
  const { usePlaybackShortcut } = await import('../../packages/front/src/app/use-playback-shortcut')
  const Shortcut = () => { usePlaybackShortcut(); return null }
  let ui: ReturnType<typeof render>
  await act(async () => {
    ui = render(createElement(ConfigProvider, { platform: Platform.ANDROID, children: createElement(AdaptivityProvider, { children: createElement(AppRoot, { children: [createElement(Shortcut, { key: 'shortcut' }), ...Array.from({ length: copies }, (_, key) => createElement(ActionTabs, { key }))] }) }) }))
    await vi.advanceTimersByTimeAsync(100)
  })
  if (settle) await act(async () => { await vi.advanceTimersByTimeAsync(1500) })
  return ui!
}

it('shows the persisted upgrade announcement once, closes after five seconds and does not steal focus', async () => {
  const browser = createChrome({ equalizerAnnouncementPending: true })
  const ui = await mount()
  expect(screen.getByText('Доступен эквалайзер')).toBeTruthy()
  expect(browser.snapshot().equalizerAnnouncementPending).toBe(false)
  expect(document.activeElement?.closest('.vkap_settings_hint')).toBeNull()
  await act(async () => { await vi.advanceTimersByTimeAsync(4800) })
  expect(screen.getByText('Доступен эквалайзер')).toBeTruthy()
  await act(async () => { await vi.advanceTimersByTimeAsync(300) })
  expect(screen.queryByText('Доступен эквалайзер')).toBeNull()
  ui.unmount()
  await mount()
  expect(screen.queryByText('Доступен эквалайзер')).toBeNull()
})

it('waits for layout to settle before showing and consumes the announcement only on presentation', async () => {
  const browser = createChrome({ equalizerAnnouncementPending: true })
  await mount(1, false)
  expect(screen.queryByText('Доступен эквалайзер')).toBeNull()
  expect(browser.snapshot().equalizerAnnouncementPending).toBe(true)
  await act(async () => { await vi.advanceTimersByTimeAsync(1499) })
  expect(screen.queryByText('Доступен эквалайзер')).toBeNull()
  await act(async () => { await vi.advanceTimersByTimeAsync(1) })
  expect(screen.getByText('Доступен эквалайзер')).toBeTruthy()
  expect(browser.snapshot().equalizerAnnouncementPending).toBe(false)
})

it('cancels the pending hint when settings are opened before the delay expires', async () => {
  const browser = createChrome({ equalizerAnnouncementPending: true })
  await mount(1, false)
  await act(async () => { fireEvent.click(screen.getByRole('tab', { name: 'Настройки' })) })
  await act(async () => { await vi.advanceTimersByTimeAsync(2000) })
  expect(screen.queryByText('Доступен эквалайзер')).toBeNull()
  expect(browser.snapshot().equalizerAnnouncementPending).toBe(false)
})

it('cancels a pending access hint when access is granted during its delay', async () => {
  const browser = createChrome(mix)
  browser.api.permissions.contains.mockResolvedValue(false)
  await mount(1, false)
  expect(screen.queryByText('Эквалайзеру нужен доступ')).toBeNull()
  browser.api.permissions.contains.mockResolvedValue(true)
  await act(async () => { browser.api.permissions.onAdded.emit({ origins: ['https://*.okcdn.ru/*'] }) })
  await act(async () => { await vi.advanceTimersByTimeAsync(2000) })
  expect(screen.queryByText('Эквалайзеру нужен доступ')).toBeNull()
})

it('can dismiss the announcement explicitly and open settings directly from its anchor', async () => {
  const browser = createChrome({ equalizerAnnouncementPending: true })
  await mount()
  await act(async () => { fireEvent.click(screen.getByLabelText('Закрыть подсказку')) })
  expect(screen.queryByText('Доступен эквалайзер')).toBeNull()
  await act(async () => { await browser.api.storage.local.set({ equalizerAnnouncementPending: true }) })
  await act(async () => { await vi.advanceTimersByTimeAsync(1500) })
  await act(async () => { fireEvent.click(screen.getByRole('tab', { name: 'Настройки' })) })
  expect(screen.queryByText('Доступен эквалайзер')).toBeNull()
  expect(browser.snapshot().equalizerAnnouncementPending).toBe(false)
})

it('keeps the playback Space shortcut available while the non-modal hint is showing', async () => {
  const browser = createChrome({ equalizerAnnouncementPending: true })
  browser.api.runtime.onMessage.addListener(() => {})
  await mount()
  expect(screen.getByText('Доступен эквалайзер')).toBeTruthy()
  await act(async () => { fireEvent.keyDown(window, { key: ' ', code: 'Space' }) })
  expect(browser.api.runtime.sendMessage).toHaveBeenCalledWith({ target: 'service-worker', type: 'toggle-playback' })
})

const mix = { equalizer: { ...equalizer.defaults, enabled: true }, equalizerStatus: 'unavailable', played: true, activeTrack: { id: 'current', url: 'https://vd123.okcdn.ru/track.mp3' } }

it('warns for the actual denied CDN, can close, and does not repeat on each subsequent track', async () => {
  const browser = createChrome(mix)
  browser.api.permissions.contains.mockResolvedValue(false)
  await mount()
  expect(screen.getByText('Эквалайзеру нужен доступ')).toBeTruthy()
  await act(async () => { fireEvent.click(screen.getByLabelText('Закрыть подсказку')) })
  await act(async () => { await browser.api.storage.local.set({ activeTrack: { id: 'next', url: 'https://vd456.okcdn.ru/next.mp3' } }) })
  expect(screen.queryByText('Эквалайзеру нужен доступ')).toBeNull()
})

it('auto-closes a CDN warning and removes it immediately when permission is granted', async () => {
  const browser = createChrome(mix)
  browser.api.permissions.contains.mockResolvedValue(false)
  await mount()
  await act(async () => { await vi.advanceTimersByTimeAsync(5100) })
  expect(screen.queryByText('Эквалайзеру нужен доступ')).toBeNull()
  await act(async () => { await browser.api.storage.local.set({ equalizer: { ...equalizer.defaults, enabled: false } }) })
  await act(async () => { await browser.api.storage.local.set({ equalizer: mix.equalizer }) })
  await act(async () => { await vi.advanceTimersByTimeAsync(1500) })
  expect(screen.getByText('Эквалайзеру нужен доступ')).toBeTruthy()
  browser.api.permissions.contains.mockResolvedValue(true)
  await act(async () => { browser.api.permissions.onAdded.emit({ origins: ['https://*.okcdn.ru/*'] }) })
  expect(screen.queryByText('Эквалайзеру нужен доступ')).toBeNull()
})

it('reacts when URL hydration resolves the same selected track to the Mix CDN', async () => {
  const browser = createChrome({ ...mix, activeTrack: { id: 'current', url: '' } })
  browser.api.permissions.contains.mockResolvedValue(false)
  await mount()
  expect(screen.queryByText('Эквалайзеру нужен доступ')).toBeNull()
  await act(async () => { await browser.api.storage.local.set({ activeTrack: mix.activeTrack }) })
  await act(async () => { await vi.advanceTimersByTimeAsync(1500) })
  expect(screen.getByText('Эквалайзеру нужен доступ')).toBeTruthy()
})

it('keeps a warning when responsive navigation copies receive a combined playback update', async () => {
  const browser = createChrome({ ...mix, played: false, activeTrack: null })
  browser.api.permissions.contains.mockResolvedValue(false)
  await mount(2)
  await act(async () => { await browser.api.storage.local.set({ played: true, activeTrack: mix.activeTrack, equalizerStatus: 'unavailable' }) })
  await act(async () => { await vi.advanceTimersByTimeAsync(1500) })
  expect(screen.getAllByText('Эквалайзеру нужен доступ')).toHaveLength(2)
})

it.each([
  { equalizer: equalizer.defaults }, { played: false }, { equalizerStatus: 'active' },
  { activeTrack: { id: 'other', url: 'https://okcdn.ru.example.org/track.mp3' } }
])('does not warn when EQ is off, paused, applied or a different server is used: %j', async override => {
  const browser = createChrome({ ...mix, ...override })
  browser.api.permissions.contains.mockResolvedValue(false)
  await mount()
  expect(screen.queryByText('Эквалайзеру нужен доступ')).toBeNull()
})

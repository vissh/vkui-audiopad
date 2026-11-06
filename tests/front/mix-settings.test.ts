// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { commonTypes } from '@vk-audiopad/common'
import { createChrome } from '../helpers/chrome'
import { controlledFetch } from '../helpers/fetch'

const payload = {
  response: {
    settings: {
      title: 'Настроить VK Микс',
      multi_select: true,
      mix_categories: [
        { id: 'vibes', title: 'Настроение', options: [{ id: 'happy', title: 'Радостно', selected: false }, { id: 'sad', title: 'Грустно', selected: false }] },
        { id: 'langs', title: 'Язык', options: [{ id: 'ru', title: 'Русский', selected: false }] }
      ]
    }
  }
}

beforeEach(() => {
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('ResizeObserver', class { observe () {} unobserve () {} disconnect () {} })
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
})
afterEach(cleanup)

const setup = async (currentPlaylist?: commonTypes.Playlist) => {
  const browser = createChrome({ userId: '1', currentPlaylist: currentPlaylist ?? null, webToken: { userId: '1', accessToken: 'synthetic', expires: Number.MAX_SAFE_INTEGER, logoutHash: '', error: null } })
  const network = controlledFetch()
  const { startSessionService } = await import('../../packages/service-worker/src/session')
  startSessionService()
  vi.resetModules()
  const { ConfigProvider, AdaptivityProvider, Platform } = await import('@vkontakte/vkui')
  const { SessionQueryProvider } = await import('@/app/SessionQueryProvider')
  const { VKMixSettings } = await import('@/widgets/vk-mix/ui/VKMixSettings')
  render(createElement(SessionQueryProvider, { children: createElement(ConfigProvider, { platform: Platform.VKCOM, children: createElement(AdaptivityProvider, { children: createElement(VKMixSettings, { userId: '1' }) }) }) }))
  await act(async () => { await browser.api.storage.local.get() })
  return { ...browser, network }
}

it('loads settings on demand, stages choices without playback, applies options and restores them on reopening', async () => {
  const page = await setup()
  const commands: commonTypes.Message[] = []
  page.api.runtime.onMessage.addListener(message => { commands.push(message as commonTypes.Message) })
  expect(page.network.requests).toHaveLength(0)
  fireEvent.click(screen.getByRole('button', { name: 'Настроить VK Микс' }))
  expect(screen.getByLabelText('Загрузка настроек VK Микса')).toBeTruthy()
  await waitFor(() => { expect(page.network.requests).toHaveLength(1) })
  expect(page.network.requests[0].url).toContain('audio.getStreamMixSettings')
  await act(async () => { page.network.requests[0].resolve(Response.json(payload)) })
  fireEvent.click(await screen.findByRole('button', { name: 'Радостно' }))
  fireEvent.click(screen.getByRole('button', { name: 'Грустно' }))
  fireEvent.click(screen.getByRole('button', { name: 'Русский' }))
  expect(screen.getByRole('button', { name: 'Радостно' }).getAttribute('aria-pressed')).toBe('false')
  expect(commands.filter(message => message.type === commonTypes.MessageType.ACTIVE_TRACK)).toHaveLength(0)
  fireEvent.click(screen.getByRole('button', { name: 'Применить' }))
  const selected = commands.find(message => message.type === commonTypes.MessageType.ACTIVE_TRACK)
  if (selected?.type !== commonTypes.MessageType.ACTIVE_TRACK) throw new Error('Expected playback command')
  expect(selected.playlist).toMatchObject({ title: 'Грустно · Русский', mixId: 'common', isVkMix: true, tracks: [] })
  expect(JSON.parse(selected.playlist.mixOptions ?? '')).toMatchObject({ vibes: ['sad'], langs: ['ru'] })
  await waitFor(() => { expect(screen.queryByRole('dialog')).toBeNull() })
  await act(async () => { await page.api.storage.local.set({ currentPlaylist: selected.playlist }) })
  fireEvent.click(screen.getByRole('button', { name: 'Настроить VK Микс' }))
  expect((await screen.findByRole('button', { name: 'Грустно' })).getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(screen.getByRole('button', { name: 'Сбросить' }))
  expect(screen.getByRole('button', { name: 'Грустно' }).getAttribute('aria-pressed')).toBe('false')
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', code: 'Escape', keyCode: 27 })
  await waitFor(() => { expect(screen.queryByRole('dialog')).toBeNull() })
  expect(commands.filter(message => message.type === commonTypes.MessageType.ACTIVE_TRACK)).toHaveLength(1)
  await act(async () => { await page.api.storage.local.set({ currentPlaylist: null }) })
  expect(screen.getByRole('button', { name: 'Настроить VK Микс' }).textContent).toContain('Грустно · Русский')
  expect(page.snapshot().vkMixPreferences).toEqual({ 1: { options: selected.playlist.mixOptions, title: 'Грустно · Русский' } })
  fireEvent.click(screen.getByRole('button', { name: 'Сбросить настройки VK Микса' }))
  const reset = commands.filter(message => message.type === commonTypes.MessageType.ACTIVE_TRACK).at(-1)
  expect(reset).toMatchObject({ playlist: { title: 'VK Микс', mixOptions: '' } })
})

it('keeps remembered Mix choices separate for each account', async () => {
  const page = await setup()
  const { rememberMix } = await import('@/entities/vk-mix')
  await act(async () => { rememberMix('2', '{"vibes":["sad"]}', 'Other account'); await page.api.storage.local.get() })
  expect(screen.getByRole('button', { name: 'Настроить VK Микс' }).textContent).toBe('Настроить')
  await act(async () => { rememberMix('1', '{"vibes":["happy"]}', 'Радостно'); await page.api.storage.local.get() })
  expect(screen.getByRole('button', { name: 'Настроить VK Микс' }).textContent).toContain('Радостно')
  expect(page.snapshot().vkMixPreferences).toMatchObject({ 2: { title: 'Other account' }, 1: { title: 'Радостно' } })
})

it('shows a retry on settings failure and cancels an unfinished read when closed', async () => {
  const page = await setup()
  fireEvent.click(screen.getByRole('button', { name: 'Настроить VK Микс' }))
  await waitFor(() => { expect(page.network.requests).toHaveLength(1) })
  await act(async () => { page.network.requests[0].resolve(Response.json({ error: { error_code: 15 } })) })
  fireEvent.click(await screen.findByRole('button', { name: 'Повторить' }))
  await waitFor(() => { expect(page.network.requests).toHaveLength(2) })
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', code: 'Escape', keyCode: 27 })
  await waitFor(() => { expect(page.network.requests[1].init?.signal?.aborted).toBe(true) })
})

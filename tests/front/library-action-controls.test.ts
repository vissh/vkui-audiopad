// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { deferred } from '../helpers/deferred'
import { playlist, track } from '../helpers/playback'

beforeEach(() => {
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
})
afterEach(cleanup)

const setup = async () => {
  const browser = createChrome({ userId: '1', webToken: { userId: '1', accessToken: 'synthetic', expires: Number.MAX_SAFE_INTEGER, logoutHash: '', error: null } })
  const { startSessionService } = await import('../../packages/service-worker/src/session')
  startSessionService()
  const network = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response('{"payload":[0,[{"is_followed":true}]]}'))
  vi.stubGlobal('fetch', network)
  const { ConfigProvider, AdaptivityProvider, Platform } = await import('@vkontakte/vkui')
  const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query')
  const { FollowIcon } = await import('@/features/follow-album')
  const { AddToMyMusicButton } = await import('@/features/add-to-my-music')
  const { Notification } = await import('@/shared/ui/notification')
  const mount = (children: ReactNode) => render(createElement(QueryClientProvider, { client: new QueryClient(), children: createElement(ConfigProvider, { platform: Platform.ANDROID, children: createElement(AdaptivityProvider, {}, children, createElement(Notification)) }) }))
  const album = (ownerId: string, id = 'same') => ({ ...playlist([], id), ownerId, followHash: 'synthetic', coverUrl: '', gridCoverUrls: [], authorLine: '', authorName: '', infoLine: '' })
  return { ...browser, network, FollowIcon, AddToMyMusicButton, mount, album }
}

it('keeps equal album IDs from different owners independent and does not open the surrounding card', async () => {
  const page = await setup()
  const open = vi.fn()
  page.mount(createElement('div', { onClick: open },
    createElement('div', { 'data-testid': 'first' }, createElement(page.FollowIcon, { album: page.album('1') })),
    createElement('div', { 'data-testid': 'second' }, createElement(page.FollowIcon, { album: page.album('2') }))
  ))
  const button = await within(screen.getByTestId('first')).findByRole('button', { name: 'Добавить плейлист в мою музыку' })
  fireEvent.click(button)
  await within(screen.getByTestId('first')).findByRole('button', { name: 'Удалить плейлист из моей музыки' })
  expect(within(screen.getByTestId('second')).getByRole('button', { name: 'Добавить плейлист в мою музыку' })).not.toBeNull()
  expect(open).not.toHaveBeenCalled()
})

it('shares pending follow state across duplicate cards and retains concurrent results for different albums', async () => {
  const page = await setup()
  const first = deferred<Response>()
  const second = deferred<Response>()
  page.network.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
  page.mount(createElement('div', {},
    createElement(page.FollowIcon, { album: page.album('1', 'A') }),
    createElement(page.FollowIcon, { album: page.album('1', 'A') }),
    createElement(page.FollowIcon, { album: page.album('1', 'B') })
  ))
  const buttons = await screen.findAllByRole('button', { name: 'Добавить плейлист в мою музыку' })
  buttons[0].focus()
  act(() => { fireEvent.click(buttons[0]); fireEvent.click(buttons[1]); fireEvent.click(buttons[2]) })
  expect(page.network).toHaveBeenCalledTimes(2)
  expect(buttons[0].getAttribute('aria-disabled')).toBe('true')
  expect(buttons[0].getAttribute('aria-busy')).toBe('true')
  expect(document.activeElement).toBe(buttons[0])
  expect(buttons[0].hasAttribute('disabled')).toBe(false)
  await waitFor(() => { expect(buttons[1].hasAttribute('disabled')).toBe(true) })
  await act(async () => { second.resolve(new Response('{"payload":[0,[{"is_followed":true}]]}')) })
  await act(async () => { first.resolve(new Response('{"payload":[0,[{"is_followed":true}]]}')) })
  await waitFor(() => { expect(screen.getAllByRole('button', { name: 'Удалить плейлист из моей музыки' })).toHaveLength(3) })
  expect(document.activeElement).toBe(buttons[0])
})

it('keeps a failed follow unchanged and shows safe feedback', async () => {
  const page = await setup()
  page.network.mockResolvedValueOnce(new Response('{"payload":[0,[{"unexpected":"synthetic-private-value"}]]}'))
  page.mount(createElement(page.FollowIcon, { album: page.album('1') }))
  fireEvent.click(await screen.findByRole('button', { name: 'Добавить плейлист в мою музыку' }))
  await screen.findByText('Не удалось изменить плейлист. Проверьте библиотеку VK перед повторной попыткой')
  expect(screen.queryByText(/synthetic-private/)).toBeNull()
  expect(screen.queryByRole('button', { name: 'Удалить плейлист из моей музыки' })).toBeNull()
})

it('disables duplicate add requests, preserves the successful ID/metadata and invokes no success callback on failure', async () => {
  const page = await setup()
  const response = deferred<Response>()
  page.network.mockReturnValueOnce(response.promise)
  const added = vi.fn()
  page.mount(createElement(page.AddToMyMusicButton, { track: { ...track('-2_10'), title: 'Original title', fromAct: false }, onAfterAdd: added }))
  const button = screen.getByRole('button', { name: 'Добавить в мою музыку' })
  act(() => { fireEvent.click(button); fireEvent.click(button) })
  await waitFor(() => { expect(page.network).toHaveBeenCalledOnce() })
  expect(button.getAttribute('aria-disabled')).toBe('true')
  expect(button.getAttribute('aria-busy')).toBe('true')
  await act(async () => { response.resolve(new Response('{"response":{"items_count":1,"errors_count":0,"items":[{"new_owner_id":1,"new_audio_id":100}],"errors":[]}}')) })
  await waitFor(() => { expect(added).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ id: '1_100', title: 'Original title' })) })
  page.network.mockResolvedValueOnce(new Response('{"error":{"error_code":15,"error_msg":"synthetic-private-value"}}'))
  await waitFor(() => { expect(button.getAttribute('aria-busy')).toBeNull() })
  fireEvent.click(button)
  await screen.findByText('Не удалось добавить аудиозапись. Проверьте библиотеку VK перед повторной попыткой')
  expect(added).toHaveBeenCalledOnce()
})

it('does not show the previous account\'s added library copy in the player', async () => {
  const page = await setup()
  await page.api.storage.local.set({ activeTrack: { ...track('-2_10'), fromAct: false } })
  page.network.mockResolvedValueOnce(new Response('{"response":{"items_count":1,"errors_count":0,"items":[{"new_owner_id":1,"new_audio_id":100}],"errors":[]}}'))
  const { Buttons } = await import('../../packages/front/src/widgets/player/ui/Buttons')
  page.mount(createElement(Buttons))
  fireEvent.click(await screen.findByRole('button', { name: 'Добавить в мою музыку' }))
  await screen.findByRole('button', { name: 'Удалить из моей музыки' })
  await act(async () => { await page.api.storage.local.set({ userId: '2' }) })
  await screen.findByRole('button', { name: 'Добавить в мою музыку' })
  expect(screen.queryByRole('button', { name: 'Удалить из моей музыки' })).toBeNull()
})

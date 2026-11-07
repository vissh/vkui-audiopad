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

afterEach(() => {
  cleanup()
  vi.doUnmock('@vk-audiopad/common')
  vi.doUnmock('@/entities/modal')
})

const setup = async () => {
  const token: commonTypes.WebToken = { userId: '1', accessToken: 'synthetic', expires: Number.MAX_SAFE_INTEGER, logoutHash: '', error: null }
  const browser = createChrome({ userId: '1', sessionEpoch: 'epoch-one', webToken: token, deviceId: 'device', currentPlaylist: playlist(['1_1']), volume: 0.4 })
  const before = browser.snapshot()
  const fetchToken = vi.fn(async (_signal?: AbortSignal) => token)
  vi.doMock('@vk-audiopad/common', async importOriginal => {
    const original = await importOriginal<typeof import('@vk-audiopad/common')>()
    return { ...original, vkApiClient: { ...original.vkApiClient, fetchAppWebToken: fetchToken } }
  })
  const { startSessionService } = await import('../../packages/service-worker/src/session')
  startSessionService()
  const signInModal = vi.fn()
  const permissionModal = vi.fn()
  vi.doMock('@/entities/modal', () => ({ setSignInModal: signInModal, setRequestPermissionModal: permissionModal }))
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"response":{}}')))
  const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query')
  const { ConfigProvider, AdaptivityProvider, Platform } = await import('@vkontakte/vkui')
  const { SignIn } = await import('@/features/sign-in')
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  const mount = () => render(createElement(QueryClientProvider, {
    client,
    children: createElement(ConfigProvider, { platform: Platform.ANDROID, children: createElement(AdaptivityProvider, { children: createElement(SignIn) }) })
  }))
  return { ...browser, before, token, fetchToken, signInModal, permissionModal, mount }
}

it('preserves data, shows a retry action and recovers after a transient failure', async () => {
  const session = await setup()
  session.fetchToken.mockRejectedValueOnce(new Error('synthetic private upstream detail'))
  session.mount()
  expect((await screen.findByRole('status')).textContent).toContain('Не удалось проверить подключение к VK')
  expect(screen.queryByText(/synthetic private/)).toBeNull()
  expect(session.snapshot()).toEqual(session.before)
  expect(session.signInModal).not.toHaveBeenCalled()
  const { onlineManager } = await import('@tanstack/react-query')
  await act(async () => {
    onlineManager.setOnline(false)
    onlineManager.setOnline(true)
  })
  expect(session.fetchToken).toHaveBeenCalledOnce()
  const response = deferred<commonTypes.WebToken>()
  session.fetchToken.mockReturnValueOnce(response.promise)
  fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
  const pending = await screen.findByRole('button', { name: 'Проверяем подключение' })
  expect(pending.hasAttribute('disabled')).toBe(true)
  fireEvent.click(pending)
  expect(session.fetchToken).toHaveBeenCalledTimes(2)
  await act(async () => { response.resolve(session.token) })
  await waitFor(() => { expect(screen.queryByRole('status')).toBeNull() })
  expect(session.snapshot()).toEqual(session.before)
  expect(session.api.storage.local.remove).not.toHaveBeenCalled()
  expect(session.signInModal).not.toHaveBeenCalled()
})

it('requests sign-in only for a confirmed unauthorized token', async () => {
  const session = await setup()
  const { vkApiClient } = await import('@vk-audiopad/common')
  session.fetchToken.mockResolvedValueOnce(vkApiClient.UnauthorizedWebToken)
  session.mount()
  await waitFor(() => { expect(session.signInModal).toHaveBeenCalledOnce() })
  expect(screen.queryByRole('status')).toBeNull()
  expect(session.snapshot()).toEqual({ volume: 0.4, sessionEpoch: expect.any(String) })
  expect(fetch).not.toHaveBeenCalled()
})

it('shows persistence failures without automatic retry and succeeds after explicit retry', async () => {
  const session = await setup()
  session.api.storage.local.set.mockRejectedValueOnce(new Error('Write failed'))
  session.mount()
  await screen.findByRole('status')
  expect(session.fetchToken).toHaveBeenCalledOnce()
  expect(session.snapshot()).toEqual(session.before)
  fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
  await waitFor(() => { expect(screen.queryByRole('status')).toBeNull() })
  expect(session.fetchToken).toHaveBeenCalledTimes(2)
  expect(session.snapshot()).toEqual(session.before)
})

it('does not open a permission modal from a callback after unmount', async () => {
  const session = await setup()
  let finish = () => {}
  session.api.permissions.contains.mockImplementationOnce((_permissions, onResult) => {
    finish = () => { onResult?.(false) }
    return Promise.resolve(false)
  })
  const view = session.mount()
  await waitFor(() => { expect(session.api.permissions.contains).toHaveBeenCalledOnce() })
  view.unmount()
  act(finish)
  expect(session.permissionModal).not.toHaveBeenCalled()
})

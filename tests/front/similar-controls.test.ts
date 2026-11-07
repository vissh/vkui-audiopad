// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { deferred } from '../helpers/deferred'
import { track } from '../helpers/playback'

beforeEach(() => {
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
})
afterEach(cleanup)

const setup = async () => {
  createChrome({ userId: '1' })
  const response = deferred<Response>()
  const network = vi.fn(async () => await response.promise)
  vi.stubGlobal('fetch', network)
  const openRow = vi.fn()
  const { ConfigProvider, AdaptivityProvider, Platform } = await import('@vkontakte/vkui')
  const { SimilarButton } = await import('@/features/similar')
  const { Notification } = await import('@/shared/ui/notification')
  render(createElement(ConfigProvider, {
    platform: Platform.ANDROID,
    children: createElement(AdaptivityProvider, {},
      createElement('div', { onClick: openRow }, createElement(SimilarButton, { userId: '1', track: track('1_1'), size: 's' })), createElement(Notification))
  }))
  return { response, network, openRow }
}

it('keeps the same focused action while loading, blocks duplicate activation and restores it after an empty result', async () => {
  const page = await setup()
  const button = screen.getByRole('button', { name: 'Показать похожие' })
  button.focus()
  act(() => { fireEvent.click(button); fireEvent.click(button) })
  expect(page.network).toHaveBeenCalledOnce()
  expect(screen.getByRole('button', { name: 'Показать похожие' })).toBe(button)
  expect(document.activeElement).toBe(button)
  expect(button.getAttribute('aria-busy')).toBe('true')
  expect(page.openRow).not.toHaveBeenCalled()
  await act(async () => { page.response.resolve(new Response('<html></html>')) })
  await waitFor(() => { expect(button.getAttribute('aria-busy')).toBeNull() })
  expect(document.activeElement).toBe(button)
  expect(button.getAttribute('aria-disabled')).toBeNull()
})

it('ends loading and exposes safe feedback after request failure so the action can be retried', async () => {
  const page = await setup()
  const button = screen.getByRole('button', { name: 'Показать похожие' })
  fireEvent.click(button)
  await act(async () => { page.response.reject(new Error('synthetic-private-value')) })
  await screen.findByText('Не удалось найти похожие треки. Повторите попытку')
  expect(button.getAttribute('aria-busy')).toBeNull()
  expect(screen.queryByText(/synthetic-private-value/)).toBeNull()
  page.network.mockResolvedValueOnce(new Response('<html></html>'))
  fireEvent.click(button)
  await waitFor(() => { expect(page.network).toHaveBeenCalledTimes(2) })
  expect(page.openRow).not.toHaveBeenCalled()
})

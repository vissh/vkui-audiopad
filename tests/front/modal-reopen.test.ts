// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'

afterEach(cleanup)

it.each(['open', 'closing'])('reopens settings while its previous instance is %s', async phase => {
  vi.useFakeTimers()
  createChrome()
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
  const { ConfigProvider, AdaptivityProvider, Platform } = await import('@vkontakte/vkui')
  const { AppModalRoot } = await import('@/entities/modal/ui/AppModalRoot')
  const { setSettingsModal } = await import('@/entities/modal/model/atom')
  render(createElement(ConfigProvider, { platform: Platform.ANDROID, children: createElement(AdaptivityProvider, { children: createElement(AppModalRoot) }) }))
  await act(async () => { setSettingsModal() })
  await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
  expect(screen.getByText('Настройки')).not.toBeNull()
  if (phase === 'closing') fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))
  await act(async () => { setSettingsModal() })
  await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
  expect(screen.getByText('Настройки')).not.toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))
  await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
  expect(screen.queryByText('Настройки')).toBeNull()
})

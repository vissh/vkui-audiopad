// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'

afterEach(cleanup)

it.each(['failed', 'ignored', 'handled'])('shows safe feedback only for an unavailable or stale command: %s', async outcome => {
  const browser = createChrome()
  vi.stubGlobal('matchMedia', vi.fn((media: string) => ({ matches: false, media, addListener () {}, removeListener () {}, addEventListener () {}, removeEventListener () {} })))
  browser.api.runtime.onMessage.addListener((message: unknown, _sender, respond) => {
    if (typeof message !== 'object' || message == null || !('requestId' in message)) return
    respond(outcome === 'failed'
      ? { requestId: message.requestId, ok: false, error: { message: 'private upstream details' } }
      : { requestId: message.requestId, ok: true, outcome })
  })
  const { ConfigProvider, AdaptivityProvider, AppRoot } = await import('@vkontakte/vkui')
  const { Notification } = await import('@/shared/ui/notification')
  const { sendMessage } = await import('@/shared/lib/send-message')
  const { commonTypes } = await import('@vk-audiopad/common')
  render(createElement(ConfigProvider, { children: createElement(AdaptivityProvider, { children: createElement(AppRoot, { children: createElement(Notification) }) }) }))
  await act(async () => { await sendMessage({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.REPEAT }) })
  if (outcome === 'failed') expect(screen.getByText('Не удалось подтвердить выполнение действия. Проверьте состояние плеера')).toBeTruthy()
  else if (outcome === 'ignored') expect(screen.getByText('Очередь изменилась. Повторите действие')).toBeTruthy()
  else expect(screen.queryByText(/Не удалось|Очередь изменилась/)).toBeNull()
  expect(document.body.textContent).not.toContain('private upstream')
  expect(browser.api.runtime.sendMessage).toHaveBeenCalledOnce()
})

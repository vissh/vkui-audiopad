// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { commonTypes } from '@vk-audiopad/common'
import { createChrome } from '../helpers/chrome'
import { controlledFetch } from '../helpers/fetch'
import { track } from '../helpers/playback'

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe () {} unobserve () {} disconnect () {} })
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
})
afterEach(cleanup)

const lyricalTrack = (id = '1_2') => ({ ...track(id), flags: commonTypes.TrackFlagBit.CAN_ADD | commonTypes.TrackFlagBit.HAS_LYRICS, title: 'Synthetic song', artist: 'Synthetic artist' })
const response = (text: string[]) => new Response(JSON.stringify({ response: { lyrics: { text } } }))
const timestampedResponse = (lines: string[]) => new Response(JSON.stringify({ response: { lyrics: { timestamps: lines.map((line, index) => ({ begin: index * 1000, end: (index + 1) * 1000, ...(line === '' ? { interlude: true } : { line }) })) } } }))

const setup = async (activeTrack: commonTypes.TrackItem | null = lyricalTrack()) => {
  const browser = createChrome({ userId: '1', activeTrack, played: false, webToken: { userId: '1', accessToken: 'synthetic', expires: Number.MAX_SAFE_INTEGER, logoutHash: '', error: null } })
  const network = controlledFetch()
  const { startSessionService } = await import('../../packages/service-worker/src/session')
  startSessionService()
  vi.resetModules()
  const { ConfigProvider, AdaptivityProvider, Platform } = await import('@vkontakte/vkui')
  const { SessionQueryProvider } = await import('@/app/SessionQueryProvider')
  const { Player } = await import('@/widgets/player')
  render(createElement(SessionQueryProvider, {
    children: createElement(ConfigProvider, { platform: Platform.ANDROID, children: createElement(AdaptivityProvider, {}, createElement(Player)) })
  }))
  await act(async () => { await browser.api.storage.local.get() })
  return { ...browser, network }
}

it.each([null, track('1_2')])('hides the lyrics control without availability and sends no request: %j', async activeTrack => {
  const page = await setup(activeTrack)
  expect(screen.queryByRole('button', { name: 'Показать текст' })).toBeNull()
  expect(page.network.requests).toHaveLength(0)
})

it('loads on open once, renders plain text with stanza breaks, and reuses cached lyrics after closing', async () => {
  const page = await setup()
  const button = screen.getByRole('button', { name: 'Показать текст' })
  expect(page.network.requests).toHaveLength(0)
  button.focus()
  fireEvent.click(button)
  fireEvent.click(button)
  await waitFor(() => { expect(page.network.requests).toHaveLength(1) })
  expect(screen.getByLabelText('Загрузка текста')).toBeTruthy()
  await act(async () => { page.network.requests[0].resolve(response(['First stanza', '', '<img src=x onerror=alert(1)>'])) })
  const text = await screen.findByText(/First stanza/)
  expect(text.textContent).toBe('First stanza\n\n<img src=x onerror=alert(1)>')
  expect(text.querySelector('img')).toBeNull()
  expect(screen.getByRole('dialog', { name: 'Synthetic song' })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Закрыть текст' }))
  await waitFor(() => { expect(screen.queryByRole('dialog')).toBeNull() })
  await waitFor(() => { expect(document.activeElement).toBe(button) })
  fireEvent.click(button)
  await screen.findByText(/First stanza/)
  expect(page.network.requests).toHaveLength(1)
  expect(page.api.storage.local.set).not.toHaveBeenCalled()
  expect(page.api.runtime.sendMessage).toHaveBeenCalled()
  for (const [message] of page.api.runtime.sendMessage.mock.calls) {
    expect(message).toMatchObject({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.SESSION_REQUEST })
  }
})

it.each(['button', 'escape'])('restores focus without reopening the tooltip after closing via %s', async method => {
  const page = await setup()
  const button = screen.getByRole('button', { name: 'Показать текст' })
  act(() => { button.focus() })
  await screen.findByRole('tooltip', { hidden: true })
  fireEvent.click(button)
  await waitFor(() => { expect(page.network.requests).toHaveLength(1) })
  await act(async () => { page.network.requests[0].resolve(response(['Synthetic text'])) })
  await screen.findByText('Synthetic text')
  if (method === 'button') fireEvent.click(screen.getByRole('button', { name: 'Закрыть текст' }))
  else fireEvent.keyDown(document.activeElement ?? document, { key: 'Escape', code: 'Escape', keyCode: 27 })
  await waitFor(() => { expect(screen.queryByRole('dialog')).toBeNull() })
  await waitFor(() => { expect(document.activeElement).toBe(button) })
  await waitFor(() => { expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull() })
  fireEvent.mouseOut(button, { relatedTarget: document.body })
  fireEvent.mouseOver(button)
  await screen.findByRole('tooltip', { hidden: true })
  fireEvent.mouseOut(button, { relatedTarget: document.body })
  act(() => { button.blur() })
  await waitFor(() => { expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull() })
  act(() => { button.focus() })
  await screen.findByRole('tooltip', { hidden: true })
})

it('retires lyrics with the account and does not reuse the old account cache for the same track', async () => {
  const page = await setup()
  fireEvent.click(screen.getByRole('button', { name: 'Показать текст' }))
  await waitFor(() => { expect(page.network.requests).toHaveLength(1) })
  await act(async () => { page.network.requests[0].resolve(response(['Account one'])) })
  await screen.findByText('Account one')
  await act(async () => {
    await page.api.storage.local.set({
      userId: '2',
      sessionEpoch: 'account-two-session',
      webToken: { userId: '2', accessToken: 'synthetic-two', expires: Number.MAX_SAFE_INTEGER, logoutHash: '', error: null }
    })
  })
  await waitFor(() => { expect(screen.queryByRole('dialog')).toBeNull() })
  fireEvent.click(screen.getByRole('button', { name: 'Показать текст' }))
  await waitFor(() => { expect(page.network.requests).toHaveLength(2) })
  expect((page.network.requests[1].init?.body as URLSearchParams).get('access_token')).toBe('synthetic-two')
  expect(screen.queryByText('Account one')).toBeNull()
  await act(async () => { page.network.requests[1].resolve(response(['Account two'])) })
  await screen.findByText('Account two')
})

it('shows timestamped lyrics in the player reader instead of a load error', async () => {
  const page = await setup()
  fireEvent.click(screen.getByRole('button', { name: 'Показать текст' }))
  await waitFor(() => { expect(page.network.requests).toHaveLength(1) })
  await act(async () => { page.network.requests[0].resolve(timestampedResponse(['Synthetic timed line', '', 'Synthetic timed line'])) })
  expect((await screen.findByText(/Synthetic timed line/)).textContent).toBe('Synthetic timed line\n\nSynthetic timed line')
  expect(screen.queryByText('Не удалось загрузить текст')).toBeNull()
  expect(page.network.requests).toHaveLength(1)
})

it('shows safe errors and retries only on explicit activation', async () => {
  const page = await setup()
  fireEvent.click(screen.getByRole('button', { name: 'Показать текст' }))
  await waitFor(() => { expect(page.network.requests).toHaveLength(1) })
  await act(async () => { page.network.requests[0].reject(new Error('synthetic-private-value')) })
  await screen.findByText('Не удалось загрузить текст')
  expect(screen.queryByText(/synthetic-private-value/)).toBeNull()
  expect(page.network.requests).toHaveLength(1)
  fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
  await waitFor(() => { expect(page.network.requests).toHaveLength(2) })
  await act(async () => { page.network.requests[1].resolve(response([])) })
  await screen.findByText('Текст пока недоступен')
})

it('cancels on close and ignores a late result after another track replaces the selection', async () => {
  const page = await setup()
  fireEvent.click(screen.getByRole('button', { name: 'Показать текст' }))
  await waitFor(() => { expect(page.network.requests).toHaveLength(1) })
  fireEvent.click(screen.getByRole('button', { name: 'Закрыть текст' }))
  await waitFor(() => { expect(page.network.requests[0].init?.signal?.aborted).toBe(true) })
  fireEvent.click(screen.getByRole('button', { name: 'Показать текст' }))
  await waitFor(() => { expect(page.network.requests).toHaveLength(2) })
  await act(async () => { await page.api.storage.local.set({ activeTrack: lyricalTrack('1_3') }) })
  await waitFor(() => { expect(screen.queryByRole('dialog')).toBeNull() })
  expect(page.network.requests[1].init?.signal?.aborted).toBe(true)
  await act(async () => { page.network.requests[0].resolve(response(['Obsolete text'])); page.network.requests[1].resolve(response(['Obsolete text'])) })
  expect(screen.queryByText('Obsolete text')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Показать текст' }))
  await waitFor(() => { expect(page.network.requests).toHaveLength(3) })
  await act(async () => { page.network.requests[2].resolve(response(['New selection'])) })
  await screen.findByText('New selection')
})

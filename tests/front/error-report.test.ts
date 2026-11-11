// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'

beforeEach(() => {
  createChrome()
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => { cleanup(); document.head.replaceChildren() })

it('includes release/browser/asset identity in a copyable safe report and offers recovery', async () => {
  Object.assign(chrome.runtime, { getManifest: () => ({ version: '3.4.1' }) })
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 Chrome/142.0.0.0 Safari/537.36')
  const script = document.createElement('script')
  script.src = 'chrome-extension://test-extension/assets/index-release.js'
  document.head.append(script)
  const { VKApiError } = await import('../../packages/common/src/vk-api-error')
  const { Content } = await import('@/shared/ui/content')
  render(createElement(Content, { display: true, error: new VKApiError('format', { operation: 'section', stage: 'retry', status: 200, contentType: 'html', attempt: 2 }), children: 'Loaded content' }))
  expect(screen.getByText(/VK вернул веб-страницу/)).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Обновить интерфейс' })).toBeTruthy()
  fireEvent.click(screen.getByText('Информация об ошибке', { selector: 'summary' }))
  const textarea = screen.getByRole('textbox', { name: 'Информация об ошибке' }) as HTMLTextAreaElement
  expect(textarea.readOnly).toBe(true)
  expect(JSON.parse(textarea.value)).toMatchObject({ reportVersion: 1, extensionVersion: '3.4.1', browser: 'Chrome/142.0.0.0', assets: ['assets/index-release.js'], error: { kind: 'format', operation: 'section', stage: 'retry', status: 200, contentType: 'html' } })
  expect(screen.getByText('Loaded content')).toBeTruthy()
})

it('keeps unknown error messages and nested secrets out of the UI and its console report', async () => {
  const { Content } = await import('@/shared/ui/content')
  const error = Object.assign(new Error('private-token'), { cause: { access_token: 'private-token' } })
  render(createElement(Content, { display: true, error, children: null }))
  fireEvent.click(screen.getByText('Информация об ошибке', { selector: 'summary' }))
  expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).not.toContain('private-token')
  expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain('private-token')
})

it('reports render crashes without depending on UI providers or exposing the thrown message', async () => {
  const { ApplicationErrorBoundary } = await import('@/app/ApplicationErrorBoundary')
  const Crash = (): never => { throw new TypeError('private-render-detail') }
  render(createElement(ApplicationErrorBoundary, { children: createElement(Crash) }))
  expect(screen.getByRole('button', { name: 'Перезагрузить интерфейс' })).toBeTruthy()
  fireEvent.click(screen.getByText('Информация об ошибке', { selector: 'summary' }))
  const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
  expect(JSON.parse(textarea.value).error.name).toBe('TypeError')
  expect(textarea.value).not.toContain('private-render-detail')
})

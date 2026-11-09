// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react'
import { createElement } from 'react'
import { readFileSync } from 'node:fs'
import { afterEach, expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'

afterEach(() => {
  cleanup()
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo')
})

it('keeps the extension manifest out of Web App Manifest discovery', () => {
  const html = readFileSync('packages/front/index.html', 'utf8')
  const document = new DOMParser().parseFromString(html, 'text/html')
  expect(document.querySelector('link[rel~="manifest"]')).toBeNull()
})

it.each([true, false])('keeps modal scroll locking on the correct viewport with popup=%s', async popup => {
  const browser = createChrome()
  vi.stubGlobal('chrome', { ...browser.api, extension: { getViews: () => popup ? [window] : [] } })
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
  const elementScroll = vi.fn()
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { value: elementScroll, configurable: true })
  const { ConfigProvider, AdaptivityProvider, useScrollLock } = await import('@vkontakte/vkui')
  const { ApplicationViewport } = await import('@/app/ApplicationViewport')
  const { setActiveTab } = await import('@/shared/model')
  const { commonTypes } = await import('@vk-audiopad/common')
  const Lock = ({ enabled }: { enabled: boolean }) => { useScrollLock(enabled); return null }
  const tree = (locked: boolean) => createElement(ConfigProvider, { children: createElement(AdaptivityProvider, { children: createElement(ApplicationViewport, { children: createElement(Lock, { enabled: locked }) }) }) })
  const ui = render(tree(false))
  await act(async () => {})
  vi.mocked(window.scrollTo).mockClear()
  elementScroll.mockClear()
  await act(async () => { setActiveTab({ tab: commonTypes.ContentTab.RADIO }) })
  if (popup) {
    expect(elementScroll).toHaveBeenCalledWith({ left: 0, top: 0 })
    expect(window.scrollTo).not.toHaveBeenCalled()
  } else {
    expect(window.scrollTo).toHaveBeenCalledWith({ left: 0, top: 0 })
    expect(elementScroll).not.toHaveBeenCalled()
  }
  ui.rerender(tree(true))
  if (popup) {
    expect(document.documentElement.style.position).toBe('')
    expect(ui.container.querySelector<HTMLElement>('.vkap_action_popup')?.style.position).toBe('absolute')
  } else {
    expect(document.documentElement.style.position).toBe('fixed')
  }
  ui.rerender(tree(false))
  expect(document.documentElement.style.position).toBe('')
  expect(ui.container.querySelector<HTMLElement>('.vkap_action_popup')?.style.position ?? '').toBe('')
})

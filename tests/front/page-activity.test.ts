// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
})
afterEach(cleanup)

it('pauses hidden navigation subscriptions and reads the latest route when reactivated', async () => {
  const browser = createChrome({ activeTab: { tab: 'general' } })
  const { PageActivityContext } = await import('@/shared/lib/page-activity')
  const { useActiveTab } = await import('@/shared/model')
  const renders = new Map<string, number>()
  const Probe = ({ name }: { name: string }) => {
    const route = useActiveTab()
    renders.set(name, (renders.get(name) ?? 0) + 1)
    return createElement('span', {}, name + ': ' + route.tab)
  }
  const tree = (active: boolean) => createElement('div', {},
    createElement(Probe, { name: 'visible' }),
    createElement(PageActivityContext.Provider, { value: active, children: createElement(Probe, { name: 'retained' }) }))
  const view = render(tree(false))
  await act(async () => { await browser.api.storage.local.get() })
  const count = renders.get('retained')
  for (const tab of ['my-music', 'explore', 'radio']) {
    await act(async () => { await browser.api.storage.local.set({ activeTab: { tab } }) })
  }
  expect(screen.getByText('visible: radio')).not.toBeNull()
  expect(renders.get('retained')).toBe(count)
  view.rerender(tree(true))
  expect(screen.getByText('retained: radio')).not.toBeNull()
})

it('keeps hidden search inputs out of typing and focus updates, then restores their current value', async () => {
  const browser = createChrome({ activeTab: { tab: 'general' } })
  const { PageActivityContext } = await import('@/shared/lib/page-activity')
  const { SearchInput } = await import('@/features/search')
  const { ConfigProvider } = await import('@vkontakte/vkui')
  const tree = (secondActive: boolean) => createElement(ConfigProvider, {
    children: createElement('div', {},
      createElement(PageActivityContext.Provider, { value: !secondActive, children: createElement('div', { hidden: secondActive }, createElement(SearchInput)) }),
      createElement(PageActivityContext.Provider, { value: secondActive, children: createElement('div', { hidden: !secondActive }, createElement(SearchInput)) }))
  })
  const view = render(tree(false))
  await act(async () => { await browser.api.storage.local.get() })
  const [first, second] = view.container.querySelectorAll<HTMLInputElement>('input[type=search]')
  const focus = vi.spyOn(second, 'focus')
  fireEvent.change(first, { target: { value: 'Search text' } })
  expect(first.value).toBe('Search text')
  expect(second.value).toBe('')
  expect(focus).not.toHaveBeenCalled()
  view.rerender(tree(true))
  expect(second.value).toBe('Search text')
  expect(document.activeElement).toBe(second)
})

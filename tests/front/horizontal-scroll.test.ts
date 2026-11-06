// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(200)
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(600)
})
afterEach(cleanup)

const mount = async (showArrows: boolean | 'always' = true) => {
  const { ConfigProvider, AdaptivityProvider, Platform } = await import('@vkontakte/vkui')
  const { HorizontalScroll } = await import('@/shared/ui/horizontal-scroll')
  const tree = (text = 'Карточка') => createElement(ConfigProvider, { platform: Platform.ANDROID, children: createElement(AdaptivityProvider, { children: createElement(HorizontalScroll, { showArrows, scrollAnimationDuration: 1, children: createElement('button', {}, text) }) }) })
  const view = render(tree())
  return { ...view, tree, root: screen.getByRole('group', { name: 'Прокрутка по горизонтали' }), scroller: view.container.querySelector('.vkuiHorizontalScroll__in') as HTMLDivElement }
}

it('reveals named, accessible scroll buttons when keyboard focus enters the content', async () => {
  await mount()
  expect(screen.queryByRole('button', { name: 'Вперед' })).toBeNull()
  act(() => { screen.getByRole('button', { name: 'Карточка' }).focus() })
  const next = screen.getByRole('button', { name: 'Вперед' })
  expect(next.getAttribute('aria-hidden')).toBe('false')
  expect(next.tabIndex).toBe(0)
  act(() => { next.focus() })
  expect(document.activeElement).toBe(next)
  expect(next.closest('[aria-hidden="true"]')).toBeNull()
})

it('moves focus to the scroll region when the focused next arrow disappears at the end', async () => {
  const view = await mount('always')
  const next = screen.getByRole('button', { name: 'Вперед' })
  view.scroller.scrollLeft = 200
  act(() => { next.focus() })
  const focus = vi.spyOn(view.root, 'focus')
  vi.useFakeTimers()
  fireEvent.click(next)
  expect(screen.queryByRole('button', { name: 'Вперед' })).toBeNull()
  expect(document.activeElement).toBe(view.root)
  expect(focus).toHaveBeenCalledWith({ preventScroll: true })
  await act(async () => { await vi.advanceTimersByTimeAsync(32) })
  expect(view.scroller.scrollLeft).toBe(400)
})

it('moves focus to the scroll region when the focused previous arrow disappears at the start', async () => {
  const view = await mount('always')
  vi.useFakeTimers()
  view.scroller.scrollLeft = 200
  fireEvent.scroll(view.scroller)
  await act(async () => { await vi.advanceTimersByTimeAsync(32) })
  const previous = screen.getByRole('button', { name: 'Назад' })
  expect(previous.getAttribute('aria-hidden')).toBe('false')
  act(() => { previous.focus() })
  fireEvent.click(previous)
  await act(async () => { await vi.advanceTimersByTimeAsync(32) })
  fireEvent.scroll(view.scroller)
  await act(async () => { await vi.advanceTimersByTimeAsync(32) })
  expect(view.scroller.scrollLeft).toBe(0)
  expect(screen.queryByRole('button', { name: 'Назад' })).toBeNull()
  expect(document.activeElement).toBe(view.root)
})

it('retains arrow focus across content updates and avoids focus handoff when the entire rail unmounts', async () => {
  const view = await mount('always')
  const next = screen.getByRole('button', { name: 'Вперед' })
  act(() => { next.focus() })
  view.rerender(view.tree('Новая карточка'))
  expect(document.activeElement).toBe(next)
  const focus = vi.spyOn(view.root, 'focus')
  view.unmount()
  expect(focus).not.toHaveBeenCalled()
})

it('preserves explicitly disabled arrows while content remains keyboard accessible', async () => {
  await mount(false)
  act(() => { screen.getByRole('button', { name: 'Карточка' }).focus() })
  expect(screen.queryByRole('button', { name: 'Вперед' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Назад' })).toBeNull()
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Карточка' }))
})

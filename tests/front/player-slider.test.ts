// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe () {} unobserve () {} disconnect () {} })
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
  vi.stubGlobal('PointerEvent', class extends MouseEvent {
    pointerType: string
    pointerId: number
    constructor (type: string, init: PointerEventInit = {}) {
      super(type, init)
      this.pointerType = init.pointerType ?? 'mouse'
      this.pointerId = init.pointerId ?? 1
    }
  })
})
afterEach(cleanup)

const rect = { x: 50, y: 0, left: 50, top: 0, right: 250, bottom: 12, width: 200, height: 12, toJSON: () => ({}) }

const mount = async (max = 100, disabled = false) => {
  const { ConfigProvider, AdaptivityProvider } = await import('@vkontakte/vkui')
  const { PlayerSlider } = await import('@/shared/ui/player-slider')
  const { commonUtils } = await import('@vk-audiopad/common')
  const change = vi.fn()
  const props = { 'aria-label': 'Шкала', value: 25, max, disabled, formatValue: max === 180 ? commonUtils.toHHMMSS : (value: number) => `${value}%`, onChange: change }
  const view = render(createElement(ConfigProvider, { children: createElement(AdaptivityProvider, { children: createElement(PlayerSlider, props) }) }))
  const input = screen.getByRole('slider')
  const root = view.container.querySelector<HTMLElement>('.vkap_player_slider')!
  vi.spyOn(root, 'getBoundingClientRect').mockReturnValue(rect)
  return { ...view, root, input, change }
}

it.each([{ max: 180, middle: '1:30', end: '3:00' }, { max: 100, middle: '50%', end: '100%' }])('previews a clamped value under the pointer without changing the $max range', async ({ max, middle, end }) => {
  const { root, input, change } = await mount(max)
  fireEvent.pointerEnter(root, { clientX: 150 })
  expect((await screen.findByRole('tooltip', { hidden: true })).textContent).toContain(middle)
  fireEvent.pointerMove(root, { clientX: 500 })
  await waitFor(() => { expect(screen.getByRole('tooltip', { hidden: true }).textContent).toContain(end) })
  expect((input as HTMLInputElement).value).toBe('25')
  expect(change).not.toHaveBeenCalled()
  fireEvent.keyDown(document, { key: 'Escape' })
  await waitFor(() => { expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull() })
  fireEvent.pointerMove(root, { clientX: 100 })
  expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull()
  fireEvent.pointerLeave(root)
  fireEvent.pointerEnter(root, { clientX: -50 })
  expect((await screen.findByRole('tooltip', { hidden: true })).textContent).toContain(max === 180 ? '0:00' : '0%')
  fireEvent.pointerLeave(root)
  await waitFor(() => { expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull() })
})

it('shows the current value for keyboard focus and keeps the native range without a visible thumb', async () => {
  const { root, input, container } = await mount()
  const matches = input.matches.bind(input)
  vi.spyOn(input, 'matches').mockImplementation(selector => selector === ':focus-visible' || matches(selector))
  act(() => { input.focus() })
  expect((await screen.findByRole('tooltip', { hidden: true })).textContent).toContain('25%')
  expect(root.classList.contains('vkap_player_slider_focus')).toBe(true)
  const style = document.createElement('style')
  style.textContent = readFileSync('packages/front/src/shared/ui/player-slider/PlayerSlider.css', 'utf8')
  document.head.append(style)
  try {
    const thumb = container.querySelector('.vkuiSliderThumb__host')!
    expect(getComputedStyle(thumb).backgroundColor).toBe('rgba(0, 0, 0, 0)')
    expect(getComputedStyle(thumb).boxShadow).toBe('none')
    expect(input.getAttribute('type')).toBe('range')
  } finally { style.remove() }
  fireEvent.keyDown(input, { key: 'Escape' })
  await waitFor(() => { expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull() })
  expect(document.activeElement).toBe(input)
  fireEvent.keyDown(input, { key: 'ArrowRight' })
  expect((await screen.findByRole('tooltip', { hidden: true })).textContent).toContain('25%')
  act(() => { input.blur() })
  await waitFor(() => { expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull() })
})

it('keeps a disabled range and touch hover free of preview hints', async () => {
  const disabled = await mount(100, true)
  fireEvent.pointerEnter(disabled.root, { clientX: 150 })
  expect((disabled.input as HTMLInputElement).disabled).toBe(true)
  expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull()
  disabled.unmount()
  const touch = await mount()
  fireEvent.pointerEnter(touch.root, { clientX: 150, pointerType: 'touch' })
  expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull()
})

it('keeps seek preview separate from pointer release and native keyboard changes', async () => {
  const browser = createChrome({ currentTime: 20, duration: 180 })
  const commands = vi.fn()
  browser.api.runtime.onMessage.addListener(message => commands(message))
  const { ConfigProvider, AdaptivityProvider } = await import('@vkontakte/vkui')
  const { CurrentTimeSlider } = await import('@/features/change-current-time')
  const view = render(createElement(ConfigProvider, { children: createElement(AdaptivityProvider, { children: createElement(CurrentTimeSlider) }) }))
  await act(async () => { await browser.api.storage.local.get() })
  const root = view.container.querySelector<HTMLElement>('.vkap_player_slider')!
  const control = view.container.querySelector<HTMLElement>('.vkap_player_slider_control')!
  const thumbs = view.container.querySelector('.vkuiSlider__thumbs')!
  vi.spyOn(root, 'getBoundingClientRect').mockReturnValue(rect)
  vi.spyOn(thumbs, 'getBoundingClientRect').mockReturnValue(rect)
  control.setPointerCapture = vi.fn()
  control.releasePointerCapture = vi.fn()
  const input = screen.getByRole('slider')
  const matches = input.matches.bind(input)
  vi.spyOn(input, 'matches').mockImplementation(selector => selector !== ':focus-visible' && matches(selector))
  fireEvent.pointerEnter(root, { clientX: 150 })
  expect((await screen.findByRole('tooltip', { hidden: true })).textContent).toContain('1:30')
  expect(commands).not.toHaveBeenCalled()
  fireEvent.pointerDown(control, { clientX: 150, button: 0 })
  fireEvent.mouseDown(control, { clientX: 150, button: 0 })
  expect((screen.getByRole('slider') as HTMLInputElement).value).toBe('90')
  expect(commands).not.toHaveBeenCalled()
  fireEvent.pointerUp(control, { clientX: 150, button: 0 })
  fireEvent.mouseUp(document, { clientX: 150, button: 0 })
  expect(commands).toHaveBeenCalledExactlyOnceWith({ target: 'service-worker', type: 'current-time', value: 90 })
  fireEvent.change(screen.getByRole('slider'), { target: { value: '91' } })
  expect(commands).toHaveBeenLastCalledWith({ target: 'service-worker', type: 'current-time', value: 91 })
  fireEvent.pointerLeave(root)
  await waitFor(() => { expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull() })
})

it('previews a volume percentage without writing the stored level', async () => {
  const browser = createChrome({ volume: 0.5 })
  const { ConfigProvider, AdaptivityProvider } = await import('@vkontakte/vkui')
  const { VolumeControl } = await import('@/features/change-volume')
  const view = render(createElement(ConfigProvider, { children: createElement(AdaptivityProvider, { children: createElement(VolumeControl) }) }))
  await act(async () => { await browser.api.storage.local.get() })
  browser.api.storage.local.set.mockClear()
  const root = view.container.querySelector<HTMLElement>('.vkap_player_slider')!
  vi.spyOn(root, 'getBoundingClientRect').mockReturnValue(rect)
  fireEvent.pointerEnter(root, { clientX: 200 })
  expect((await screen.findByRole('tooltip', { hidden: true })).textContent).toContain('75%')
  expect(screen.getByRole('slider', { name: 'Громкость' }).getAttribute('aria-valuetext')).toBe('50%')
  expect(browser.api.storage.local.set).not.toHaveBeenCalled()
  expect(browser.snapshot().volume).toBe(0.5)
})

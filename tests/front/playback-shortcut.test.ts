// @vitest-environment jsdom
import { act, cleanup, fireEvent, renderHook } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { deferred } from '../helpers/deferred'

afterEach(() => { cleanup(); document.body.innerHTML = '' })

const setup = async (tab: { id: number } | null = { id: 1 }) => {
  const browser = createChrome()
  browser.api.tabs.getCurrent.mockResolvedValue(tab ?? undefined)
  browser.api.runtime.onMessage.addListener(() => {})
  const { usePlaybackShortcut } = await import('../../packages/front/src/app/use-playback-shortcut')
  const view = renderHook(usePlaybackShortcut)
  return { ...browser, ...view }
}

const space = (target: Element = document.body, extra: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true, ...extra })
  fireEvent(target, event)
  return event
}

it('toggles from a tab, prevents scrolling and ignores held-key repeats without writing playback state', async () => {
  const page = await setup()
  const { commonTypes } = await import('@vk-audiopad/common')
  expect(space().defaultPrevented).toBe(true)
  expect(space(document.body, { repeat: true }).defaultPrevented).toBe(true)
  expect(page.api.runtime.sendMessage).toHaveBeenCalledExactlyOnceWith({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.TOGGLE_PLAYBACK })
  space()
  expect(page.api.runtime.sendMessage).toHaveBeenCalledTimes(2)
  expect(page.api.storage.local.set).not.toHaveBeenCalled()
  page.unmount()
  expect(space().defaultPrevented).toBe(false)
  expect(page.api.runtime.sendMessage).toHaveBeenCalledTimes(2)
})

it('handles the first Space immediately after opening the popup without clicking', async () => {
  const page = await setup(null)
  expect(space().defaultPrevented).toBe(true)
  expect(page.api.runtime.sendMessage).toHaveBeenCalledExactlyOnceWith({ target: 'service-worker', type: 'toggle-playback' })
})

it.each([
  '<input>', '<textarea></textarea>', '<select><option>One</option></select>',
  '<button><span>Play</span></button>',
  '<div contenteditable="true"><span>Editable</span></div>',
  '<div role="slider"><span>Volume</span></div>', '<div role="button"><span>Action</span></div>'
])('preserves focused controls and editable descendants: %s', async html => {
  const page = await setup()
  document.body.innerHTML = html
  expect(space(document.body.querySelector('span') ?? document.body.firstElementChild!).defaultPrevented).toBe(false)
  expect(page.api.runtime.sendMessage).not.toHaveBeenCalled()
})

it.each([
  '<a href="#"><span>Artist</span></a>',
  '<div role="link" tabindex="0"><span>Playlist</span></div>',
  '<div role="tab" tabindex="0"><span>Главная</span></div>'
])('preserves native keyboard activation when navigation retains focus: %s', async html => {
  const page = await setup()
  document.body.innerHTML = html
  const navigation = document.body.firstElementChild as HTMLElement
  navigation.focus()
  expect(space(navigation.querySelector('span')!).defaultPrevented).toBe(false)
  expect(page.api.runtime.sendMessage).not.toHaveBeenCalled()
  expect(document.activeElement).toBe(navigation)
})

it('recognizes the Space key when the browser omits its physical code', async () => {
  const page = await setup()
  expect(space(document.body, { code: '' }).defaultPrevented).toBe(true)
  expect(page.api.runtime.sendMessage).toHaveBeenCalledOnce()
})

it('ignores modified, composing, handled and non-Space events and blocks playback behind dialogs', async () => {
  const page = await setup()
  for (const extra of [{ ctrlKey: true }, { altKey: true }, { metaKey: true }, { shiftKey: true }, { isComposing: true }, { code: 'Enter', key: 'Enter' }]) {
    expect(space(document.body, extra).defaultPrevented).toBe(false)
  }
  const handled = (event: Event) => { event.preventDefault() }
  document.body.addEventListener('keydown', handled)
  space()
  document.body.removeEventListener('keydown', handled)
  document.body.innerHTML = '<div role="dialog"><p>Reader</p></div>'
  expect(space(document.querySelector('p')!).defaultPrevented).toBe(false)
  expect(space().defaultPrevented).toBe(false)
  expect(page.api.runtime.sendMessage).not.toHaveBeenCalled()
  document.body.innerHTML = ''
  space()
  expect(page.api.runtime.sendMessage).toHaveBeenCalledOnce()
})

it('handles Space without waiting for a tab lookup', async () => {
  const browser = createChrome()
  const response = deferred<{ id: number } | undefined>()
  browser.api.tabs.getCurrent.mockReturnValue(response.promise)
  const { usePlaybackShortcut } = await import('../../packages/front/src/app/use-playback-shortcut')
  const view = renderHook(usePlaybackShortcut)
  browser.api.runtime.onMessage.addListener(() => {})
  expect(space().defaultPrevented).toBe(true)
  expect(browser.api.runtime.sendMessage).toHaveBeenCalledOnce()
  view.unmount()
  await act(async () => { response.resolve({ id: 1 }) })
  expect(space().defaultPrevented).toBe(false)
  expect(browser.api.runtime.sendMessage).toHaveBeenCalledOnce()
})

it('does not depend on tab detection to prevent scrolling', async () => {
  const browser = createChrome()
  browser.api.tabs.getCurrent.mockRejectedValue(new Error('unavailable'))
  const { usePlaybackShortcut } = await import('../../packages/front/src/app/use-playback-shortcut')
  renderHook(usePlaybackShortcut)
  browser.api.runtime.onMessage.addListener(() => {})
  await act(async () => { await Promise.resolve() })
  expect(space().defaultPrevented).toBe(true)
  expect(browser.api.runtime.sendMessage).toHaveBeenCalledOnce()
})

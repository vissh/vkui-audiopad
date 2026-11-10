// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { playlist } from '../helpers/playback'

afterEach(() => {
  cleanup()
  vi.doUnmock('react-intersection-observer')
})

it('animates only visible playing Mix artwork and uses compositor layers without a JavaScript frame loop', async () => {
  const browser = createChrome({ currentPlaylist: { ...playlist([]), isVkMix: true }, played: true })
  let onScreen = true
  const ref = vi.fn()
  vi.doMock('react-intersection-observer', () => ({ useInView: () => ({ ref, inView: onScreen }) }))
  const frames = vi.spyOn(window, 'requestAnimationFrame')
  const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
  const { VKMixBalls } = await import('../../packages/front/src/widgets/vk-mix/ui/VKMixBalls')
  const tree = (active = true) => createElement(VKMixBalls, { width: 720, height: 242, active })
  const view = render(tree())
  await act(async () => { await browser.api.storage.local.get() })
  const visual = view.container.querySelector('.vkap_mix_visual')!
  const running = () => visual.classList.contains('vkap_mix_visual_running')
  expect(running()).toBe(true)
  expect(visual.querySelectorAll('.vkap_mix_glow')).toHaveLength(4)
  expect(visual.querySelector('canvas')).toBeNull()
  expect(frames).not.toHaveBeenCalled()
  await act(async () => { await browser.api.storage.local.set({ played: false }) })
  expect(running()).toBe(false)
  await act(async () => { await browser.api.storage.local.set({ played: true }) })
  visibility.mockReturnValue('hidden')
  fireEvent(document, new Event('visibilitychange'))
  expect(running()).toBe(false)
  visibility.mockReturnValue('visible')
  fireEvent(document, new Event('visibilitychange'))
  expect(running()).toBe(true)
  onScreen = false
  view.rerender(tree())
  expect(running()).toBe(false)
  onScreen = true
  view.rerender(tree(false))
  expect(running()).toBe(false)
  view.rerender(tree())
  await act(async () => { await browser.api.storage.local.set({ currentPlaylist: playlist([]) }) })
  expect(running()).toBe(false)
})

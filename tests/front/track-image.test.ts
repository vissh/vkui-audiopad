// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, expect, it } from 'vitest'
import { TrackImage } from '../../packages/front/src/entities/track/ui/TrackImage'

afterEach(cleanup)

it('reserves cover geometry and retires image failure state when its source changes', () => {
  const view = render(createElement(TrackImage, { imageSrc: 'https://images.invalid/first.jpg', trackState: 'normal' }))
  const first = view.container.querySelector('img')!
  expect(first.getAttribute('width')).toBe('48')
  expect(first.getAttribute('height')).toBe('48')
  expect(first.getAttribute('loading')).toBe('lazy')
  expect(first.closest('[aria-hidden="true"]')).not.toBeNull()
  fireEvent.error(first)
  expect(first.classList.contains('vkap_track_cover_failed')).toBe(true)
  view.rerender(createElement(TrackImage, { imageSrc: 'https://images.invalid/second.jpg', trackState: 'normal' }))
  const second = view.container.querySelector('img')!
  expect(second).not.toBe(first)
  expect(second.classList.contains('vkap_track_cover_failed')).toBe(false)
  fireEvent.load(second)
  expect(view.container.firstElementChild?.classList.contains('vkap_track_cover_loaded')).toBe(true)
  view.rerender(createElement(TrackImage, { imageSrc: '', trackState: 'normal' }))
  expect(view.container.querySelector('img')).toBeNull()
  expect(view.container.firstElementChild?.classList.contains('vkap_track_cover_loaded')).toBe(false)
})

it('retains playback overlays and disables them in the queue editor', () => {
  const view = render(createElement(TrackImage, { imageSrc: '', trackState: 'paused' }))
  const overlay = () => view.container.querySelector('.vkap_track_cover_overlay')
  expect(overlay()?.classList.contains('vkap_track_cover_overlay_visible')).toBe(true)
  expect(overlay()?.querySelector('.vkuiIcon--play_circle_32')).not.toBeNull()
  view.rerender(createElement(TrackImage, { imageSrc: '', trackState: 'played' }))
  expect(overlay()?.querySelector('.vkuiIcon--pause_circle_32')).not.toBeNull()
  view.rerender(createElement(TrackImage, { imageSrc: '', trackState: 'normal' }))
  expect(overlay()?.classList.contains('vkap_track_cover_overlay_visible')).toBe(false)
  view.rerender(createElement(TrackImage, { imageSrc: '', trackState: 'disabled' }))
  expect(overlay()?.classList.contains('vkap_track_cover_overlay_disabled')).toBe(true)
  expect(overlay()?.querySelector('svg')).toBeNull()
  view.rerender(createElement(TrackImage, { imageSrc: '', trackState: 'normal', showOverlay: false }))
  expect(overlay()).toBeNull()
  expect(view.container.querySelector('svg')).toBeNull()
})

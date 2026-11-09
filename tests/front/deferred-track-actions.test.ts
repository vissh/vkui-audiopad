// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createElement, useState, type ReactNode } from 'react'
import { intersectionMockInstance, mockAllIsIntersecting, mockIsIntersecting, resetIntersectionMocking, setupIntersectionMocking } from 'react-intersection-observer/test-utils'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'

beforeEach(() => {
  createChrome()
  vi.useFakeTimers()
  setupIntersectionMocking(vi.fn)
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
})

afterEach(() => {
  cleanup()
  resetIntersectionMocking()
  vi.useRealTimers()
})

const mount = async (extra: { editMode?: boolean, removed?: boolean } = {}, actions: ReactNode = createElement('button', {}, 'Действие')) => {
  const { ConfigProvider, AdaptivityProvider, Platform } = await import('@vkontakte/vkui')
  const { TrackCell } = await import('@/entities/track')
  const view = render(createElement(ConfigProvider, {
    platform: Platform.ANDROID,
    children: createElement(AdaptivityProvider, {
      children: createElement('div', { role: 'list' }, createElement(TrackCell, { title: 'Трек', artist: 'Артист', duration: 180, image: '', trackState: 'normal', onClick: vi.fn(), actions, ...extra }))
    })
  }))
  return { ...view, row: screen.getByRole('listitem') }
}

it('keeps offscreen track content discoverable and mounts actions once near the viewport', async () => {
  const { row } = await mount()
  expect(screen.getByRole('button', { name: 'Воспроизвести Трек' })).toBeTruthy()
  expect(screen.getByText('Артист')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Действие' })).toBeNull()
  act(() => { mockIsIntersecting(row, true) })
  act(() => { vi.advanceTimersByTime(150) })
  const action = screen.getByRole('button', { name: 'Действие' })
  act(() => { mockAllIsIntersecting(false) })
  expect(screen.getByRole('button', { name: 'Действие' })).toBe(action)
})

it('mounts actions on keyboard focus before the next Tab, even without an observer delivery', async () => {
  await mount()
  act(() => { screen.getByRole('button', { name: 'Воспроизвести Трек' }).focus() })
  const action = screen.getByRole('button', { name: 'Действие' })
  act(() => { action.focus() })
  expect(document.activeElement).toBe(action)
})

it.each(['pointerEnter', 'pointerDown'] as const)('prepares actions synchronously on %s', async event => {
  await mount()
  fireEvent[event](screen.getByRole('button', { name: 'Воспроизвести Трек' }))
  expect(screen.getByRole('button', { name: 'Действие' })).toBeTruthy()
})

it.each([{ editMode: true }, { removed: true }])('keeps editor and restore controls immediately available for %j', async props => {
  const { row } = await mount(props)
  expect(screen.getByRole('button', { name: 'Действие' })).toBeTruthy()
  expect(row.classList.contains('vkap_track_cell_contained')).toBe(!props.editMode)
})

it('retains action state and focus after scrolling away and returning', async () => {
  const Action = () => {
    const [pending, setPending] = useState(false)
    return createElement('button', { onClick: () => { setPending(true) } }, pending ? 'Сохранение' : 'Действие')
  }
  const { row } = await mount({}, createElement(Action))
  act(() => { mockIsIntersecting(row, true) })
  act(() => { vi.advanceTimersByTime(150) })
  const action = screen.getByRole('button', { name: 'Действие' })
  fireEvent.click(action)
  act(() => { action.focus() })
  act(() => { mockAllIsIntersecting(false) })
  act(() => { mockAllIsIntersecting(true) })
  expect(screen.getByRole('button', { name: 'Сохранение' })).toBe(action)
  expect(document.activeElement).toBe(action)
})

it('cancels preparation for rows that pass through the viewport during fast scrolling', async () => {
  const { row } = await mount()
  act(() => { mockIsIntersecting(row, true) })
  act(() => { vi.advanceTimersByTime(100) })
  act(() => { mockIsIntersecting(row, false) })
  act(() => { vi.advanceTimersByTime(100) })
  expect(screen.queryByRole('button', { name: 'Действие' })).toBeNull()
  act(() => { mockIsIntersecting(row, true) })
  act(() => { vi.advanceTimersByTime(150) })
  expect(screen.getByRole('button', { name: 'Действие' })).toBeTruthy()
})

it('disconnects the observer and cancels pending preparation on unmount', async () => {
  const actionRender = vi.fn(() => createElement('button', {}, 'Действие'))
  const view = await mount({}, createElement(actionRender))
  const observer = intersectionMockInstance(view.row)
  act(() => { mockIsIntersecting(view.row, true) })
  view.unmount()
  expect(observer.unobserve).toHaveBeenCalledWith(view.row)
  act(() => { vi.advanceTimersByTime(150) })
  expect(actionRender).not.toHaveBeenCalled()
})

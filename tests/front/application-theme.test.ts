// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react'
import { createElement, useLayoutEffect } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'

const mocks = ['@/widgets/player', '@/features/sign-in', '@/features/manage-playlists', '../../packages/front/src/app/Pages']
afterEach(() => {
  cleanup()
  localStorage.clear()
  for (const path of mocks) vi.doUnmock(path)
})

const mount = async (theme: 'system' | 'light' | 'dark' = 'system') => {
  createChrome({ userId: '1' })
  localStorage.setItem('theme', theme)
  vi.stubGlobal('scrollTo', vi.fn())
  let dark = true
  const target = new EventTarget()
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    get matches () { return query === '(prefers-color-scheme: dark)' && dark },
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    dispatchEvent: target.dispatchEvent.bind(target)
  })))
  const observed: string[] = []
  const { useColorScheme } = await import('@vkontakte/vkui')
  const Probe = () => {
    const scheme = useColorScheme()
    useLayoutEffect(() => { observed.push(scheme) }, [scheme])
    return null
  }
  vi.doMock('@/widgets/player', () => ({ Player: () => null }))
  vi.doMock('@/features/sign-in', () => ({ SignIn: () => null }))
  vi.doMock('@/features/manage-playlists', () => ({ PlaylistDialogs: () => null }))
  vi.doMock('../../packages/front/src/app/Pages', () => ({ Pages: Probe }))
  const { Application } = await import('../../packages/front/src/app/Application')
  const view = render(createElement(Application))
  await act(async () => {})
  return { ...view, observed, setDark: (value: boolean) => { dark = value; target.dispatchEvent(new Event('change')) } }
}

it('uses the system dark theme in the first committed tree and follows subsequent system changes', async () => {
  const app = await mount()
  expect(app.observed).toEqual(['dark'])
  act(() => { app.setDark(false) })
  expect(app.observed).toEqual(['dark', 'light'])
  app.unmount()
  act(() => { app.setDark(true) })
  expect(app.observed).toEqual(['dark', 'light'])
})

it.each(['light', 'dark'] as const)('keeps an explicit %s preference when the system changes', async theme => {
  const app = await mount(theme)
  expect(app.observed).toEqual([theme])
  act(() => { app.setDark(false) })
  act(() => { app.setDark(true) })
  expect(app.observed).toEqual([theme])
})

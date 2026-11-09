// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { createElement, useState, type ReactNode } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { deferred } from '../helpers/deferred'

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 10000 })
  Object.defineProperty(document.documentElement, 'clientHeight', { configurable: true, value: 600 })
})

afterEach(() => {
  cleanup()
  vi.doUnmock('@vkontakte/vkui')
  vi.doUnmock('react-intersection-observer')
})

const setup = async (account = '1') => {
  const browser = createChrome({ userId: account, activeTab: { tab: 'my-music' } })
  const scroll = { y: 0 }
  const scrollTo = vi.fn((_x?: number, y = 0) => { scroll.y = y })
  const getScroll = () => ({ x: 0, y: scroll.y })
  vi.doMock('@vkontakte/vkui', async importOriginal => ({ ...await importOriginal<typeof import('@vkontakte/vkui')>(), useScroll: () => ({ scrollTo, getScroll }) }))
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const top = Number(this.dataset.top ?? 0) - scroll.y
    return { top, bottom: top + 60, height: this.hasAttribute('data-scroll-anchor') ? 60 : 0, width: 780, left: 0, right: 780, x: 0, y: top, toJSON: () => ({}) }
  })
  const { ApplicationScrollRestoration } = await import('@/app/ApplicationScrollRestoration')
  const { saveScrollPosition, readScrollPositions } = await import('@/app/scroll-positions')
  const { useScrollPagination } = await import('@/shared/lib/scroll-restoration')
  const { setActiveTab, useActiveTab } = await import('@/shared/model')
  const { commonTypes } = await import('@vk-audiopad/common')
  const key = JSON.stringify(['my-music'])
  const anchor = (id: string, top: number, hidden = false) => createElement('div', { key: id, 'data-scroll-anchor': id, 'data-top': top, hidden }, id)
  const tree = (children: ReactNode) => createElement(ApplicationScrollRestoration, { children: createElement('main', { id: 'vkap-content' }, children) })
  await act(async () => { await browser.api.storage.local.get() })
  return { browser, scroll, scrollTo, saveScrollPosition, readScrollPositions, useScrollPagination, setActiveTab, useActiveTab, commonTypes, key, anchor, tree }
}

it('saves during scrolling and restores the visible track after reopening despite insertions above it', async () => {
  const app = await setup()
  const ui = render(app.tree(app.anchor('track-3', 1000)))
  app.scroll.y = 1020
  fireEvent.scroll(window)
  fireEvent(window, new Event('pagehide'))
  expect(app.readScrollPositions('1').get(app.key)).toEqual({ y: 1020, anchor: 'track-3', offset: -20 })
  ui.unmount()
  app.scroll.y = 0
  render(app.tree(app.anchor('track-3', 1300)))
  await waitFor(() => { expect(app.scroll.y).toBe(1320) })
})

it('remembers separate positions on tab return without saving dynamic catalogs across popup closure', async () => {
  const app = await setup()
  const Page = () => {
    const tab = app.useActiveTab()
    return app.anchor(tab.tab, tab.tab === 'my-music' ? 1000 : 2000)
  }
  render(app.tree(createElement(Page)))
  app.scroll.y = 1010
  fireEvent.scroll(window)
  await act(async () => { app.setActiveTab({ tab: app.commonTypes.ContentTab.EXPLORE }) })
  expect(app.scroll.y).toBe(0)
  app.scroll.y = 2020
  fireEvent.scroll(window)
  await act(async () => { app.setActiveTab({ tab: app.commonTypes.ContentTab.MY_MUSIC }) })
  await waitFor(() => { expect(app.scroll.y).toBe(1010) })
  await act(async () => { app.setActiveTab({ tab: app.commonTypes.ContentTab.EXPLORE }) })
  await waitFor(() => { expect(app.scroll.y).toBe(2020) })
  expect([...app.readScrollPositions('1').keys()]).toEqual([app.key])
})

it('loads missing pages sequentially without sentinel intersection and stops at the saved anchor', async () => {
  const app = await setup()
  app.saveScrollPosition('1', app.key, { y: 3020, anchor: 'track-3', offset: -20 })
  const request = vi.fn()
  const Page = () => {
    const [page, setPage] = useState(1)
    app.useScrollPagination(true, {
      key: String(page),
      pending: false,
      failed: false,
      hasMore: true,
      loadMore: async () => { request(page); setPage(value => value + 1) }
    })
    return app.anchor('track-' + page, page * 1000)
  }
  render(app.tree(createElement(Page)))
  await waitFor(() => { expect(app.scroll.y).toBe(3020) })
  expect(request.mock.calls).toEqual([[1], [2]])
})

it('waits for initial data before considering an exhausted list', async () => {
  const app = await setup()
  app.saveScrollPosition('1', app.key, { y: 1020, anchor: 'target', offset: -20 })
  const Page = ({ loading }: { loading: boolean }) => {
    app.useScrollPagination(true, { key: 'initial', pending: loading, failed: false, hasMore: false, loadMore: vi.fn() })
    return loading ? null : app.anchor('target', 1200)
  }
  const ui = render(app.tree(createElement(Page, { loading: true })))
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 40)) })
  expect(app.scroll.y).toBe(0)
  ui.rerender(app.tree(createElement(Page, { loading: false })))
  await waitFor(() => { expect(app.scroll.y).toBe(1220) })
})

it.each(['wheel', 'touchstart', 'pointerdown', 'keydown'])('yields to user %s and ignores late page completion', async event => {
  const app = await setup()
  app.saveScrollPosition('1', app.key, { y: 3020, anchor: 'target', offset: -20 })
  const response = deferred<void>()
  const request = vi.fn()
  const Page = () => {
    const [loaded, setLoaded] = useState(false)
    app.useScrollPagination(true, {
      key: 'cursor',
      pending: false,
      failed: false,
      hasMore: true,
      loadMore: async () => { request(); await response.promise; setLoaded(true) }
    })
    return loaded ? app.anchor('target', 3000) : null
  }
  render(app.tree(createElement(Page)))
  await waitFor(() => { expect(request).toHaveBeenCalledOnce() })
  app.scroll.y = 400
  fireEvent(window, event === 'keydown' ? new KeyboardEvent(event, { key: 'PageDown' }) : new Event(event))
  await act(async () => { response.resolve() })
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 40)) })
  expect(app.scroll.y).toBe(400)
  expect(request).toHaveBeenCalledOnce()
})

it('does not move the new page when an obsolete continuation fails after navigation', async () => {
  const app = await setup()
  app.saveScrollPosition('1', app.key, { y: 3020, anchor: 'target', offset: -20 })
  const response = deferred<void>()
  const request = vi.fn(async () => { await response.promise })
  const Page = () => {
    const tab = app.useActiveTab()
    app.useScrollPagination(tab.tab === 'my-music', { key: 'cursor', pending: false, failed: false, hasMore: true, loadMore: request })
    return null
  }
  render(app.tree(createElement(Page)))
  await waitFor(() => { expect(request).toHaveBeenCalledOnce() })
  await act(async () => { app.setActiveTab({ tab: app.commonTypes.ContentTab.EXPLORE }) })
  app.scroll.y = 200
  await act(async () => { response.reject(new Error('synthetic failure')) })
  expect(app.scroll.y).toBe(200)
})

it.each(['failure', 'cycle', 'exhausted', 'limit'])('bounds restoration on %s', async reason => {
  const app = await setup()
  app.saveScrollPosition('1', app.key, { y: 3020, anchor: 'missing', offset: -20 })
  const request = vi.fn()
  const Page = () => {
    const [page, setPage] = useState(0)
    app.useScrollPagination(true, {
      key: reason === 'cycle' ? 'same-cursor' : String(page),
      pending: false,
      failed: false,
      hasMore: reason !== 'exhausted',
      loadMore: async () => {
        request()
        if (reason === 'failure') throw new Error('synthetic failure')
        setPage(value => value + 1)
      }
    })
    return null
  }
  render(app.tree(createElement(Page)))
  await waitFor(() => { expect(app.scroll.y).toBe(3020) })
  expect(request).toHaveBeenCalledTimes(reason === 'limit' ? 10 : reason === 'exhausted' ? 0 : 1)
})

it('ignores a hidden duplicate anchor and isolates account positions', async () => {
  const app = await setup('2')
  app.saveScrollPosition('1', app.key, { y: 1020, anchor: 'target', offset: -20 })
  render(app.tree(app.anchor('target', 1000)))
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 40)) })
  expect(app.scroll.y).toBe(0)
  cleanup()
  app.saveScrollPosition('2', app.key, { y: 2020, anchor: 'target', offset: -20 })
  render(app.tree(createElement('div', {}, createElement('div', { hidden: true }, app.anchor('target', 1000)), app.anchor('target', 2000))))
  await waitFor(() => { expect(app.scroll.y).toBe(2020) })
})

it('validates stored values, caps retained pages and tolerates unavailable localStorage', async () => {
  const app = await setup()
  localStorage.setItem('vkap-scroll-v1:1', 'invalid-json')
  expect(app.readScrollPositions('1').size).toBe(0)
  localStorage.setItem('vkap-scroll-v1:1', JSON.stringify([['bad', { y: -1, anchor: null, offset: 0 }]]))
  expect(app.readScrollPositions('1').size).toBe(0)
  for (let index = 0; index < 25; index++) app.saveScrollPosition('1', String(index), { y: index, anchor: null, offset: 0 })
  expect(app.readScrollPositions('1').size).toBe(20)
  expect(app.readScrollPositions('1').has('0')).toBe(false)
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('synthetic quota') })
  expect(() => { app.saveScrollPosition('1', 'new-page', { y: 0, anchor: null, offset: 0 }) }).not.toThrow()
})

it('ends restoration at its deadline and preserves the target when closed during loading', async () => {
  const app = await setup()
  app.saveScrollPosition('1', app.key, { y: 3020, anchor: 'target', offset: -20 })
  const Page = () => {
    app.useScrollPagination(true, { key: 'loading', pending: true, failed: false, hasMore: false, loadMore: vi.fn() })
    return null
  }
  vi.useFakeTimers()
  const ui = render(app.tree(createElement(Page)))
  await act(async () => { await vi.advanceTimersByTimeAsync(4000) })
  expect(app.scroll.y).toBe(0)
  fireEvent(window, new Event('pagehide'))
  expect(app.readScrollPositions('1').get(app.key)?.anchor).toBe('target')
  await act(async () => { await vi.advanceTimersByTimeAsync(4000) })
  expect(app.scroll.y).toBe(3020)
  ui.unmount()
})

it('drives the actual list pagination boundary through a non-intersecting sentinel', async () => {
  const app = await setup()
  app.saveScrollPosition('1', app.key, { y: 3020, anchor: 'track-3', offset: -20 })
  vi.doMock('react-intersection-observer', () => ({ useInView: () => ({ ref: () => {}, inView: false }) }))
  const { QueryClient, QueryClientProvider, useMutation } = await import('@tanstack/react-query')
  const { InfinityContent } = await import('@/shared/ui/infinity-content')
  const { ConfigProvider, AdaptivityProvider } = await import('@vkontakte/vkui')
  const request = vi.fn(async (_page: number) => {})
  const Page = () => {
    const [page, setPage] = useState(1)
    const mutation = useMutation({ mutationFn: request, onSuccess: () => { setPage(value => value + 1) } })
    return createElement(InfinityContent<number>, {
      display: true,
      hasMore: page < 5,
      paginationScope: 'library',
      pageKey: String(page),
      loadMoreArgs: page,
      loadMoreMutation: mutation,
      children: app.anchor('track-' + page, page * 1000)
    })
  }
  const client = new QueryClient()
  render(createElement(QueryClientProvider, { client, children: createElement(ConfigProvider, { children: createElement(AdaptivityProvider, { children: app.tree(createElement(Page)) }) }) }))
  await waitFor(() => { expect(app.scroll.y).toBe(3020) })
  expect(request.mock.calls.map(call => call[0])).toEqual([1, 2])
  client.clear()
})

it('writes the latest position during scrolling before the popup closes', async () => {
  const app = await setup()
  vi.useFakeTimers()
  render(app.tree(app.anchor('target', 1000)))
  app.scroll.y = 1010
  fireEvent.scroll(window)
  await act(async () => { await vi.advanceTimersByTimeAsync(100) })
  expect(app.readScrollPositions('1').get(app.key)).toEqual({ y: 1010, anchor: 'target', offset: -10 })
})

it('keeps equal playlist IDs from different owners separate and resets a new queue', async () => {
  const app = await setup()
  const { playlist } = await import('../helpers/playback')
  const first = playlist(['1_1'], 'same-id')
  const second = { ...first, ownerId: '2' }
  const Page = () => {
    const tab = app.useActiveTab()
    return app.anchor(tab.tab === 'playlist' ? tab.playlist.ownerId : 'queue', 1000)
  }
  render(app.tree(createElement(Page)))
  await act(async () => { app.setActiveTab({ tab: app.commonTypes.ContentTab.PLAYLIST, fromId: '1', playlist: first }) })
  app.scroll.y = 1010
  fireEvent.scroll(window)
  await act(async () => { app.setActiveTab({ tab: app.commonTypes.ContentTab.PLAYLIST, fromId: '1', playlist: second }) })
  expect(app.scroll.y).toBe(0)
  await act(async () => { app.setActiveTab({ tab: app.commonTypes.ContentTab.PLAYLIST, fromId: '1', playlist: first }) })
  await waitFor(() => { expect(app.scroll.y).toBe(1010) })
  await act(async () => { await app.browser.api.storage.local.set({ currentPlaylist: first }); app.setActiveTab({ tab: app.commonTypes.ContentTab.CURRENT_PLAYLIST }) })
  app.scroll.y = 1020
  fireEvent.scroll(window)
  await act(async () => { await app.browser.api.storage.local.set({ currentPlaylist: second }) })
  expect(app.scroll.y).toBe(0)
})

it('waits for a delayed downstream append after a continuation request succeeds', async () => {
  const app = await setup()
  app.saveScrollPosition('1', app.key, { y: 3020, anchor: 'track-3', offset: -20 })
  vi.doMock('react-intersection-observer', () => ({ useInView: () => ({ ref: () => {}, inView: false }) }))
  const { QueryClient, QueryClientProvider, useMutation } = await import('@tanstack/react-query')
  const { InfinityContent } = await import('@/shared/ui/infinity-content')
  const { ConfigProvider, AdaptivityProvider } = await import('@vkontakte/vkui')
  const request = vi.fn(async (_page: number) => {})
  const Page = () => {
    const [page, setPage] = useState(1)
    const mutation = useMutation({ mutationFn: request, onSuccess: () => { setTimeout(() => { setPage(value => value + 1) }, 75) } })
    return createElement(InfinityContent<number>, {
      display: true,
      hasMore: page < 3,
      paginationScope: 'queue',
      pageKey: String(page),
      loadMoreArgs: page,
      loadMoreMutation: mutation,
      children: app.anchor('track-' + page, page * 1000 + 500)
    })
  }
  const client = new QueryClient()
  render(createElement(QueryClientProvider, { client, children: createElement(ConfigProvider, { children: createElement(AdaptivityProvider, { children: app.tree(createElement(Page)) }) }) }))
  await waitFor(() => { expect(app.scroll.y).toBe(3520) })
  expect(request.mock.calls.map(call => call[0])).toEqual([1, 2])
  client.clear()
})

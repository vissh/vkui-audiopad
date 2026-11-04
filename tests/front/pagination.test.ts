// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { deferred } from '../helpers/deferred'

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
})
afterEach(() => { cleanup(); vi.doUnmock('react-intersection-observer'); vi.doUnmock('@/shared/api') })

const setup = async (initial: { display?: boolean, key?: string, scope?: string } = {}) => {
  const visibility = { inView: true }
  vi.doMock('react-intersection-observer', () => ({ useInView: () => ({ ref: () => {}, inView: visibility.inView }) }))
  const { QueryClient, QueryClientProvider, useMutation } = await import('@tanstack/react-query')
  const { ConfigProvider, AdaptivityProvider, Platform } = await import('@vkontakte/vkui')
  const { InfinityContent } = await import('@/shared/ui/infinity-content')
  const response = deferred<void>()
  const request = vi.fn(async (_args: { cursor: string }) => { await response.promise })
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const Harness = ({ display = true, pageKey = 'A', scope = 'list-1', hasMore = true }: { display?: boolean, pageKey?: string, scope?: string, hasMore?: boolean }) => {
    const mutation = useMutation({ mutationFn: request })
    return createElement(InfinityContent<{ cursor: string }>, { display, hasMore, paginationScope: scope, pageKey, loadMoreArgs: { cursor: pageKey }, loadMoreMutation: mutation, children: createElement('span', {}, 'Loaded rows') })
  }
  const tree = (display: boolean, pageKey: string, scope: string, hasMore = true) => createElement(QueryClientProvider, { client, children: createElement(ConfigProvider, { platform: Platform.ANDROID, children: createElement(AdaptivityProvider, { children: createElement(Harness, { display, pageKey, scope, hasMore }) }) }) })
  const view = render(tree(initial.display ?? true, initial.key ?? 'A', initial.scope ?? 'list-1'))
  const update = (display = true, key = 'A', scope = 'list-1', hasMore = true) => { view.rerender(tree(display, key, scope, hasMore)) }
  return { visibility, response, request, update }
}

it('does not load more data for an inactive page even when its sentinel intersects', async () => {
  const page = await setup({ display: false })
  expect(page.request).not.toHaveBeenCalled()
  page.update()
  await waitFor(() => { expect(page.request).toHaveBeenCalledOnce() })
  await act(async () => { page.response.resolve() })
})

it('stops after failure despite repeated observer/rerender events and retries only on explicit action', async () => {
  const page = await setup()
  await waitFor(() => { expect(page.request).toHaveBeenCalledOnce() })
  await act(async () => { page.response.reject(new Error('synthetic-private-value')) })
  await screen.findByText('Не удалось загрузить продолжение списка')
  expect(screen.getByText('Loaded rows')).not.toBeNull()
  expect(screen.queryByText(/synthetic-private/)).toBeNull()
  page.visibility.inView = false
  page.update()
  page.visibility.inView = true
  page.update()
  expect(page.request).toHaveBeenCalledOnce()
  const retry = deferred<void>()
  page.request.mockImplementationOnce(async () => { await retry.promise })
  const button = screen.getByRole('button', { name: 'Повторить' })
  act(() => { fireEvent.click(button); fireEvent.click(button) })
  await waitFor(() => { expect(page.request).toHaveBeenCalledTimes(2) })
  page.update(true, 'B', 'list-1', false)
  await act(async () => { retry.resolve() })
  await waitFor(() => { expect(screen.queryByRole('status')).toBeNull() })
  expect(page.request).toHaveBeenCalledTimes(2)
})

it('halts on an unchanged cursor instead of repeatedly fetching the same page', async () => {
  const page = await setup()
  await act(async () => { page.response.resolve() })
  await screen.findByText('Список не продолжился')
  page.visibility.inView = false
  page.update()
  page.visibility.inView = true
  page.update()
  expect(page.request).toHaveBeenCalledOnce()
})

it('loads progressing cursors once, rejects a cursor cycle and separates a different list', async () => {
  const page = await setup()
  await act(async () => { page.response.resolve() })
  page.update(true, 'B')
  await waitFor(() => { expect(page.request).toHaveBeenCalledTimes(2) })
  await screen.findByText('Список не продолжился')
  page.update(true, 'A')
  expect(page.request).toHaveBeenCalledTimes(2)
  page.update(true, 'A', 'list-2')
  await waitFor(() => { expect(page.request).toHaveBeenCalledTimes(3) })
})

it('does not run overlapping page requests when arguments change during loading', async () => {
  const page = await setup()
  await waitFor(() => { expect(page.request).toHaveBeenCalledOnce() })
  page.update(true, 'B')
  expect(page.request).toHaveBeenCalledOnce()
  await act(async () => { page.response.resolve() })
  await waitFor(() => { expect(page.request).toHaveBeenCalledTimes(2) })
  expect(page.request.mock.calls.map(call => call[0].cursor)).toEqual(['A', 'B'])
})

it('fails the actual queue pagination hook offline instead of pausing indefinitely or retrying on reconnect', async () => {
  const request = vi.fn(async () => { throw new Error('synthetic offline') })
  vi.doMock('@/shared/api', () => ({ fetchMorePlaylistTracks: request }))
  const { QueryClient, QueryClientProvider, onlineManager } = await import('@tanstack/react-query')
  const { useLoadMorePlaylistTracksMutation } = await import('../../packages/front/src/pages/current-playlist/model/hooks')
  const { playlist } = await import('../helpers/playback')
  const client = new QueryClient()
  onlineManager.setOnline(false)
  try {
    const { result } = renderHook(useLoadMorePlaylistTracksMutation, { wrapper: ({ children }) => createElement(QueryClientProvider, { client, children }) })
    await act(async () => {
      await expect(result.current.mutateAsync(playlist(['1_1']))).rejects.toThrow('synthetic offline')
    })
    await waitFor(() => { expect(result.current.isError).toBe(true) })
    expect(result.current.isPaused).toBe(false)
    expect(request).toHaveBeenCalledOnce()
    await act(async () => { onlineManager.setOnline(true) })
    expect(request).toHaveBeenCalledOnce()
  } finally {
    onlineManager.setOnline(true)
    client.clear()
  }
})

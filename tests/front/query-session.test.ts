// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { createElement, useEffect } from 'react'
import { type QueryClient } from '@tanstack/react-query'
import { afterEach, expect, it } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { deferred } from '../helpers/deferred'

afterEach(cleanup)

it('cancels and clears the retired account client; late uncancellable data cannot enter the new account', async () => {
  const browser = createChrome({ userId: '1' })
  const { useQuery, useQueryClient } = await import('@tanstack/react-query')
  const { useSessionUserId } = await import('@/entities/session')
  const { SessionQueryProvider } = await import('../../packages/front/src/app/SessionQueryProvider')
  const first = deferred<string>()
  const second = deferred<string>()
  const clients = new Map<string, QueryClient>()
  const signals = new Map<string, AbortSignal>()
  const Probe = () => {
    const userId = useSessionUserId()
    const client = useQueryClient()
    useEffect(() => { clients.set(userId, client) }, [userId, client])
    const query = useQuery({
      queryKey: ['private'],
      queryFn: async ({ signal }) => {
        signals.set(userId, signal)
        return await (userId === '1' ? first.promise : second.promise)
      },
      enabled: userId.length > 0
    })
    return createElement('div', {}, query.data ?? 'pending')
  }
  render(createElement(SessionQueryProvider, { children: createElement(Probe) }))
  await waitFor(() => { expect(signals.has('1')).toBe(true) })
  const original = clients.get('1')!
  await act(async () => { await browser.api.storage.local.set({ userId: '2' }) })
  await waitFor(() => { expect(signals.has('2')).toBe(true) })
  expect(clients.get('2')).not.toBe(original)
  expect(signals.get('1')?.aborted).toBe(true)
  expect(original.getQueryCache().getAll()).toHaveLength(0)
  await act(async () => { second.resolve('account-two') })
  await screen.findByText('account-two')
  await act(async () => { first.resolve('private-account-one') })
  expect(screen.queryByText('private-account-one')).toBeNull()
  expect(clients.get('2')!.getQueryData(['private'])).toBe('account-two')
})

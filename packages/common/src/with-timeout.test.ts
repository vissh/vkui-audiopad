import { expect, it, vi } from 'vitest'
import { withTimeout } from './with-timeout'

it('returns a value and removes its timer after successful completion', async () => {
  vi.useFakeTimers()
  expect(await withTimeout(async () => 'value', 1000)).toBe('value')
  expect(vi.getTimerCount()).toBe(0)
})

it('propagates caller cancellation promptly even if the operation ignores abort', async () => {
  vi.useFakeTimers()
  const controller = new AbortController()
  let inner: AbortSignal | undefined
  const result = withTimeout(async signal => {
    inner = signal
    return await new Promise<never>(() => {})
  }, 1000, controller.signal)
  const checked = expect(result).rejects.toMatchObject({ name: 'AbortError' })
  controller.abort()
  await checked
  expect(inner?.aborted).toBe(true)
  expect(vi.getTimerCount()).toBe(0)
})

it('does not start an already-cancelled operation', async () => {
  const operation = vi.fn(async () => 'value')
  const controller = new AbortController()
  controller.abort()
  await expect(withTimeout(operation, 1000, controller.signal)).rejects.toMatchObject({ name: 'AbortError' })
  expect(operation).not.toHaveBeenCalled()
})

it('bounds a permanently pending operation', async () => {
  vi.useFakeTimers()
  const result = expect(withTimeout(async () => await new Promise<never>(() => {}), 1000)).rejects.toMatchObject({ name: 'TimeoutError' })
  await vi.advanceTimersByTimeAsync(1000)
  await result
  expect(vi.getTimerCount()).toBe(0)
})

it('cleans up its timer when the operation throws', async () => {
  vi.useFakeTimers()
  await expect(withTimeout(async () => { throw new Error('synthetic') }, 1000)).rejects.toThrow('synthetic')
  expect(vi.getTimerCount()).toBe(0)
})

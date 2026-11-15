// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { registerUsageCounter } from '../../packages/front/src/app/usage-counter'

afterEach(() => { document.body.replaceChildren() })

it('keeps the existing counter outside document loading and sends it only in idle time', () => {
  vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading')
  let idle: IdleRequestCallback | undefined
  vi.stubGlobal('requestIdleCallback', vi.fn((callback: IdleRequestCallback) => { idle = callback; return 1 }))
  registerUsageCounter()
  expect(document.querySelector('img')).toBeNull()
  window.dispatchEvent(new Event('load'))
  expect(document.querySelector('img')).toBeNull()
  idle!({ didTimeout: false, timeRemaining: () => 50 })
  const image = document.querySelector('img')!
  expect(image.src).toBe('https://top-fwz1.mail.ru/counter?id=3298105;js=na')
  expect(image.hidden).toBe(true)
  window.dispatchEvent(new Event('load'))
  expect(document.querySelectorAll('img')).toHaveLength(1)
})

it('supports already loaded documents without requestIdleCallback', async () => {
  vi.useFakeTimers()
  vi.spyOn(document, 'readyState', 'get').mockReturnValue('complete')
  vi.stubGlobal('requestIdleCallback', undefined)
  registerUsageCounter()
  expect(document.querySelector('img')).toBeNull()
  await vi.advanceTimersByTimeAsync(0)
  expect(document.querySelectorAll('img')).toHaveLength(1)
})

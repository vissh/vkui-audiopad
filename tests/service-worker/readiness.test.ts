import { expect, it, vi } from 'vitest'
import { deferred } from '../helpers/deferred'

it('keeps command/hotkey invocation order across async preparation without serializing their completion', async () => {
  const { createReadiness } = await import('../../packages/service-worker/src/readiness')
  const gate = createReadiness(async () => {})
  await gate.start()
  const prepared = deferred<void>()
  const finished = deferred<void>()
  const order: string[] = []
  const first = gate.execute(async () => { order.push('command'); await finished.promise }, async () => { await prepared.promise })
  gate.run(() => { order.push('hotkey') })
  await Promise.resolve()
  expect(order).toEqual([])
  prepared.resolve()
  await vi.waitFor(() => { expect(order).toEqual(['command', 'hotkey']) })
  finished.resolve()
  await first
})

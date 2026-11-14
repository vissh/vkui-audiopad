// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react'
import { createElement, Profiler } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { LoadingPlaceholder } from '@/shared/ui/loading-placeholder'

afterEach(cleanup)

it('keeps loading decorations passive across animation periods without timers or React updates', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  const commits: string[] = []
  const view = render(createElement(Profiler, { id: 'loading', onRender: (_id, phase) => { commits.push(phase) }, children: Array.from({ length: 24 }, (_, key) => createElement(LoadingPlaceholder, { key, width: 48, height: 48 })) }))
  expect(view.container.children).toHaveLength(24)
  expect(vi.getTimerCount()).toBe(0)
  commits.length = 0
  await act(async () => { await vi.advanceTimersByTimeAsync(4500) })
  expect(commits).toEqual([])
  expect(vi.getTimerCount()).toBe(0)
})

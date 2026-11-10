import { startTransition, useEffect, useState } from 'react'

const FIRST_BATCH = 12
const NEXT_BATCH = 8

export const useProgressiveCount = (
  total: number,
  active: boolean,
  scope = '',
  { initial = FIRST_BATCH, size = NEXT_BATCH }: { initial?: number, size?: number } = {}
): number => {
  const [state, setState] = useState({ scope, count: initial })
  if (state.scope !== scope) setState({ scope, count: initial })
  const count = state.scope === scope ? state.count : initial

  useEffect(() => {
    if (!active || count >= total) return
    const append = () => {
      startTransition(() => { setState(previous => previous.scope === scope ? { scope, count: Math.min(total, previous.count + size) } : previous) })
    }
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(append, { timeout: 200 })
      return () => { window.cancelIdleCallback(id) }
    }
    const id = window.setTimeout(append, 16)
    return () => { window.clearTimeout(id) }
  }, [active, count, total, scope, size])

  return Math.min(count, total)
}

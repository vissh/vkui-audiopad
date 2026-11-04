import { afterEach, beforeEach, vi } from 'vitest'

let unexpectedRequests = 0

beforeEach(() => {
  vi.resetModules()
  unexpectedRequests = 0
  vi.stubGlobal('fetch', vi.fn(async () => {
    unexpectedRequests++
    throw new Error('Unexpected network request in an offline test: install an explicit fetch adapter')
  }))
})

afterEach(() => {
  vi.useRealTimers()
  if (unexpectedRequests > 0) throw new Error(`Unexpected network request: ${unexpectedRequests} call(s) used the default offline fetch, even if caught`)
})

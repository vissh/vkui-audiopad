import { vi } from 'vitest'
import { deferred } from './deferred'

export const controlledFetch = () => {
  const requests: Array<{
    url: string
    init?: RequestInit
    resolve: (response: Response) => void
    reject: (error: unknown) => void
  }> = []
  const fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const pending = deferred<Response>()
    requests.push({ url: input instanceof Request ? input.url : String(input), init, ...pending })
    return pending.promise
  })
  vi.stubGlobal('fetch', fetch)
  return { fetch, requests }
}

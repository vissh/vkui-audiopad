import { expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { controlledFetch } from '../helpers/fetch'

it('does not refresh a token for a cancelled Mix request', async () => {
  createChrome({ userId: '1', webToken: { accessToken: 'synthetic', userId: '1', expires: Number.MAX_SAFE_INTEGER, logoutHash: '', error: null } })
  const { startSessionService } = await import('../../packages/service-worker/src/session')
  startSessionService()
  const network = controlledFetch()
  const controller = new AbortController()
  const { getStreamMixAudios } = await import('../../packages/common/src/vk-api-client')
  const pending = getStreamMixAudios(controller.signal)
  const aborted = expect(pending).rejects.toMatchObject({ name: 'AbortError' })
  await vi.waitFor(() => { expect(network.requests).toHaveLength(1) })
  expect(network.requests[0].init?.signal?.aborted).toBe(false)
  controller.abort()
  expect(network.requests[0].init?.signal?.aborted).toBe(true)
  network.requests[0].resolve(new Response('{"error":{"error_code":5}}'))
  await aborted
  expect(network.requests).toHaveLength(1)
})

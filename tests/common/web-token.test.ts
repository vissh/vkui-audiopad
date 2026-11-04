import { expect, it, vi } from 'vitest'

it.each([401, 429, 503])('does not treat an HTTP %s token response as confirmed logout', async status => {
  const network = vi.fn(async () => new Response('{"type":"error","error_info":"unauthorized"}', { status }))
  vi.stubGlobal('fetch', network)
  const { fetchAppWebToken } = await import('../../packages/common/src/vk-api-client')
  await expect(fetchAppWebToken()).rejects.toThrow()
  expect(network).toHaveBeenCalledOnce()
})

it('recognizes the explicit successful-HTTP unauthorized token response', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"type":"error","error_info":"unauthorized"}')))
  const { fetchAppWebToken, UnauthorizedWebToken } = await import('../../packages/common/src/vk-api-client')
  expect(await fetchAppWebToken()).toEqual(UnauthorizedWebToken)
})

it('preserves the web-token request shape and converts a successful token', async () => {
  const network = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({ type: 'okay', data: { user_id: 1, access_token: 'synthetic', expires: 123456789, logout_hash: 'synthetic-hash' } })))
  vi.stubGlobal('fetch', network)
  const { fetchAppWebToken, VK_APP_ID } = await import('../../packages/common/src/vk-api-client')
  expect(await fetchAppWebToken()).toEqual({ userId: '1', accessToken: 'synthetic', expires: 123456789, logoutHash: 'synthetic-hash', error: null })
  expect(network.mock.calls[0][0]).toBe('https://login.vk.ru/?act=web_token')
  const body = network.mock.calls[0][1]?.body as FormData
  expect(body.get('app_id')).toBe(VK_APP_ID)
  expect(body.get('version')).toBe('1')
  expect(body.get('access_token')).toBe('')
})

it.each([
  { type: 'maintenance', data: { access_token: 'private-test-value' } },
  'private-test-value',
  { type: 'okay', data: 'private-test-value' },
  { type: 'okay', data: { user_id: { access_token: 'private-test-value' } } }
])('does not include a malformed token response payload in its error: %#', async payload => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(payload))))
  const { fetchAppWebToken } = await import('../../packages/common/src/vk-api-client')
  await expect(fetchAppWebToken()).rejects.not.toThrow('private-test-value')
})

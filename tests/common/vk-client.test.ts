import { expect, it, vi } from 'vitest'
import { controlledFetch } from '../helpers/fetch'

it('keeps concurrent responses associated with their original requests', async () => {
  const network = controlledFetch()
  const { request } = await import('../../packages/common/src/vk-client')
  const first = request('https://vk.ru/first', { query: 'A' })
  const second = request('https://vk.ru/second', { query: 'B' })
  expect(network.requests).toHaveLength(2)
  network.requests[1].resolve(new Response('{"result":"B"}'))
  expect(await second).toEqual({ result: 'B' })
  network.requests[0].resolve(new Response('{"result":"A"}'))
  expect(await first).toEqual({ result: 'A' })
})

it('decodes a legacy windows-1251 response before parsing the payload', async () => {
  const network = controlledFetch()
  const { request, parseResponsePayload } = await import('../../packages/common/src/vk-client')
  const pending = request('https://vk.ru/al_audio.php', { al: '1' })
  const bytes = new Uint8Array([
    ...new TextEncoder().encode('{"payload":[0,["'),
    0xcf, 0xf0, 0xe8, 0xe2, 0xe5, 0xf2,
    ...new TextEncoder().encode('"]]}')
  ])
  network.requests[0].resolve(new Response(bytes, { headers: { 'Content-Type': 'text/html; charset=windows-1251' } }))
  expect(parseResponsePayload(await pending, [1, 0])).toBe('Привет')
})

it('stops after a single reconnect when both payloads are malformed', async () => {
  const network = controlledFetch()
  const { request } = await import('../../packages/common/src/vk-client')
  const pending = request('https://vk.ru/al_audio.php', { al: '1' })
  const failure = expect(pending).rejects.toMatchObject({ kind: 'format', operation: 'unknown', stage: 'retry', attempt: 2, status: 200 })
  network.requests[0].resolve(new Response('not json'))
  await vi.waitFor(() => { expect(network.requests).toHaveLength(2) })
  expect(network.requests[1].url).toBe('https://vk.ru')
  network.requests[1].resolve(new Response('<html></html>'))
  await vi.waitFor(() => { expect(network.requests).toHaveLength(3) })
  network.requests[2].resolve(new Response('still not json'))
  await failure
  expect(network.fetch).toHaveBeenCalledTimes(3)
})

it('does not reconnect a cancelled request even when the fetch adapter returns late', async () => {
  const network = controlledFetch()
  const controller = new AbortController()
  const { request } = await import('../../packages/common/src/vk-client')
  const pending = request('https://vk.ru/al_audio.php', { al: '1' }, controller.signal)
  const aborted = expect(pending).rejects.toMatchObject({ name: 'AbortError' })
  expect(network.requests[0].init?.signal?.aborted).toBe(false)
  controller.abort()
  network.requests[0].resolve(new Response('malformed response'))
  await aborted
  expect(network.requests[0].init?.signal?.aborted).toBe(true)
  expect(network.requests).toHaveLength(1)
})

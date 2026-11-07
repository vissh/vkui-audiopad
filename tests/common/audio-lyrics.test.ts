import { expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { controlledFetch } from '../helpers/fetch'

const setup = async () => {
  createChrome({ userId: '1', webToken: { accessToken: 'synthetic', userId: '1', expires: Number.MAX_SAFE_INTEGER, logoutHash: '', error: null } })
  const { startSessionService } = await import('../../packages/service-worker/src/session')
  startSessionService()
  vi.resetModules()
  return await import('../../packages/common/src/vk-api-client')
}

it('requests the exact track/access identity and preserves stanza breaks as plain text', async () => {
  const api = await setup()
  const network = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({ response: { lyrics: { text: ['First & second', '', '<b>literal line</b>', 'Last\r\nline'] } } })))
  vi.stubGlobal('fetch', network)
  expect(await api.getAudioLyrics({ id: '-2_3', accessKey: 'synthetic-key' })).toBe('First & second\n\n<b>literal line</b>\nLast\nline')
  expect(String(network.mock.calls[0][0])).toContain('/audio.getLyrics?')
  const params = network.mock.calls[0][1]?.body
  expect(params).toBeInstanceOf(URLSearchParams)
  expect((params as URLSearchParams).get('audio_id')).toBe('-2_3_synthetic-key')
  expect(network).toHaveBeenCalledOnce()
})

it.each([{ text: [] }, { text: [' ', '\n'] }])('returns no lyrics for an explicitly empty text array %j', async ({ text }) => {
  const api = await setup()
  const network = vi.fn(async () => new Response(JSON.stringify({ response: { lyrics: { text } } })))
  vi.stubGlobal('fetch', network)
  expect(await api.getAudioLyrics({ id: '1_2', accessKey: '' })).toBeNull()
})

it('reads timestamped lyrics without dropping repeated lines or stanza breaks', async () => {
  const api = await setup()
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
    response: {
      lyrics: {
        timestamps: [
          { begin: 0, end: 1000, line: 'Synthetic chorus' },
          { begin: 1000, end: 2000, interlude: true },
          { begin: 2000, end: 3000, line: 'Synthetic chorus' },
          { begin: 3000, end: 4000, line: '<b>Literal line</b>' }
        ]
      }
    }
  }))))
  expect(await api.getAudioLyrics({ id: '1_2', accessKey: '' })).toBe('Synthetic chorus\n\nSynthetic chorus\n<b>Literal line</b>')
})

it.each([
  { timestamps: [] },
  { timestamps: [{ begin: 0, end: 100, line: ' ' }] },
  { timestamps: [{ begin: 0, end: 100, interlude: true }] }
])('returns no lyrics for an explicitly empty timestamped result %j', async lyrics => {
  const api = await setup()
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ response: { lyrics } }))))
  expect(await api.getAudioLyrics({ id: '1_2', accessKey: '' })).toBeNull()
})

it('prefers plain text when provided alongside timestamps', async () => {
  const api = await setup()
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ response: { lyrics: { text: ['Plain text'], timestamps: [{ begin: 0, end: 100, line: 'Timed text' }] } } }))))
  expect(await api.getAudioLyrics({ id: '1_2', accessKey: '' })).toBe('Plain text')
})

it.each([
  { lyrics: { timestamps: 'unexpected' } },
  { lyrics: { timestamps: [null] } },
  { lyrics: { timestamps: [{ begin: 0, end: 100 }] } },
  { lyrics: { timestamps: [{ begin: 0, end: 100, interlude: false }] } },
  { lyrics: { timestamps: [{ begin: 0, end: 100, interlude: 'true' }] } },
  { lyrics: { timestamps: [{ begin: 0, end: 100, interlude: true, line: null }] } },
  { lyrics: { timestamps: [{ line: 'Valid' }, { line: 1 }] } }
])('rejects malformed timestamped lyrics: %j', async response => {
  const api = await setup()
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ response }))))
  await expect(api.getAudioLyrics({ id: '1_2', accessKey: '' })).rejects.toMatchObject({ kind: 'format' })
})

it.each([{}, { lyrics: {} }, { lyrics: { text: 'unexpected' } }, { lyrics: { text: ['valid', 1] } }])('rejects malformed lyrics instead of treating them as absent: %j', async response => {
  const api = await setup()
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ response }))))
  await expect(api.getAudioLyrics({ id: '1_2', accessKey: '' })).rejects.toMatchObject({ kind: 'format' })
})

it('recognizes VK lyrics-not-found without swallowing other VK errors or retrying them', async () => {
  const api = await setup()
  const network = vi.fn(async () => new Response('{"error":{"error_code":104}}'))
  vi.stubGlobal('fetch', network)
  expect(await api.getAudioLyrics({ id: '1_2', accessKey: '' })).toBeNull()
  network.mockResolvedValueOnce(new Response('{"error":{"error_code":15}}'))
  await expect(api.getAudioLyrics({ id: '1_2', accessKey: '' })).rejects.toMatchObject({ code: 15 })
  expect(network).toHaveBeenCalledTimes(2)
})

it('propagates cancellation without refresh or retry', async () => {
  const api = await setup()
  const network = controlledFetch()
  const controller = new AbortController()
  const pending = expect(api.getAudioLyrics({ id: '1_2', accessKey: '' }, controller.signal)).rejects.toBe('closed')
  await vi.waitFor(() => { expect(network.requests).toHaveLength(1) })
  controller.abort('closed')
  await pending
  expect(network.requests[0].init?.signal?.aborted).toBe(true)
  expect(network.requests).toHaveLength(1)
})

it('rejects an invalid track identity before networking', async () => {
  const api = await setup()
  await expect(api.getAudioLyrics({ id: 'invalid', accessKey: '' })).rejects.toMatchObject({ kind: 'format' })
})

it.each([{ userId: '2' }, { sessionEpoch: 'next-synthetic-session' }])('rejects lyrics from a retired session without replay: %j', async change => {
  const api = await setup()
  const network = controlledFetch()
  const pending = expect(api.getAudioLyrics({ id: '1_2', accessKey: '' })).rejects.toMatchObject({ kind: 'session-changed' })
  await vi.waitFor(() => { expect(network.requests).toHaveLength(1) })
  await chrome.storage.local.set<{ userId: string, sessionEpoch: string }>(change)
  await pending
  expect(network.requests[0].init?.signal?.aborted).toBe(true)
  network.requests[0].resolve(new Response('{"response":{"lyrics":{"text":["Retired session text"]}}}'))
  await Promise.resolve()
  expect(network.requests).toHaveLength(1)
})

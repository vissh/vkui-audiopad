import { expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { controlledFetch } from '../helpers/fetch'

const session = async () => {
  const browser = createChrome({ userId: '1', webToken: { userId: '1', accessToken: 'synthetic', expires: Number.MAX_SAFE_INTEGER, error: null } })
  const { startSessionService } = await import('../../packages/service-worker/src/session')
  startSessionService()
  vi.resetModules()
  return browser
}
const saved = { id: 10, owner_id: 1, title: 'Saved', description: 'Description', count: 0, access_key: 'synthetic-key' }

it('creates a server playlist in one POST, preserving order, description and access keys', async () => {
  await session()
  const network = controlledFetch()
  const { vkPlaylists } = await import('@vk-audiopad/common')
  const pending = vkPlaylists.createPlaylist('1', ' Saved ', 'Description', ['-2_10_key', '1_20', '-2_10_key'])
  await vi.waitFor(() => { expect(network.requests).toHaveLength(1) })
  const call = network.requests[0]
  expect(new URL(call.url).pathname).toBe('/method/audio.createPlaylist')
  expect(call.init?.method).toBe('POST')
  expect(Object.fromEntries(new URLSearchParams(String(call.init?.body)))).toMatchObject({ owner_id: '1', title: 'Saved', description: 'Description', audio_ids: '-2_10_key,1_20' })
  call.resolve(Response.json({ response: { ...saved, count: 2 } }))
  expect(await pending).toMatchObject({ id: '10', ownerId: '1', count: 2 })
})

it.each([{}, 1, { ...saved, owner_id: 2 }, { ...saved, count: 1 }, { ...saved, id: 0 }])('rejects an unconfirmed creation without replay: %j', async response => {
  await session()
  const network = vi.fn(async () => Response.json({ response }))
  vi.stubGlobal('fetch', network)
  const { vkPlaylists } = await import('@vk-audiopad/common')
  await expect(vkPlaylists.createPlaylist('1', 'Saved', '')).rejects.toThrow('format')
  expect(network).toHaveBeenCalledOnce()
})

it('paginates by raw server entries while excluding subscriptions and albums from editable choices', async () => {
  await session()
  const network = vi.fn(async () => Response.json({ response: { count: 5, items: [saved, { ...saved, id: 11, owner_id: 2 }, { ...saved, id: 12, original: { owner_id: -2, playlist_id: 5 } }, { ...saved, id: 13, type: 1 }] } }))
  vi.stubGlobal('fetch', network)
  const { vkPlaylists } = await import('@vk-audiopad/common')
  const page = await vkPlaylists.getPlaylists('1')
  expect(page.items.map(item => item.id)).toEqual(['10'])
  expect(page.nextOffset).toBe(4)
  expect(vkPlaylists.toPlaybackPlaylist(page.items[0])).toMatchObject({ ownerId: '1', id: '10', accessHash: 'synthetic-key', blockId: '', tracks: [] })
})

it('rejects a stalled playlist page', async () => {
  await session()
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ response: { count: 5, items: [] } })))
  const { vkPlaylists } = await import('@vk-audiopad/common')
  await expect(vkPlaylists.getPlaylists('1')).rejects.toThrow('format')
})

it('adds a source track with its access key and validates the returned audio ID', async () => {
  await session()
  const network = vi.fn(async (_input: string, _init?: RequestInit) => Response.json({ response: [{ audio_id: 20 }] }))
  vi.stubGlobal('fetch', network)
  const { vkPlaylists } = await import('@vk-audiopad/common')
  await vkPlaylists.addTrackToPlaylist('1', '10', '-2_20', 'source-key')
  expect(new URLSearchParams(String(network.mock.calls[0]?.[1]?.body)).get('audio_ids')).toBe('-2_20_source-key')
})

it.each([1, [], [{}], [{ audio_id: 0 }], [{ audio_id: 1 }, { audio_id: 2 }]])('rejects an unconfirmed track addition: %j', async response => {
  await session()
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ response })))
  const { vkPlaylists } = await import('@vk-audiopad/common')
  await expect(vkPlaylists.addTrackToPlaylist('1', '10', '-2_20')).rejects.toThrow('format')
})

it('does not dispatch an old-account playlist action with another account token', async () => {
  await session()
  const network = vi.fn()
  vi.stubGlobal('fetch', network)
  const { vkPlaylists } = await import('@vk-audiopad/common')
  await expect(vkPlaylists.createPlaylist('2', 'Saved', '')).rejects.toThrow()
  expect(network).not.toHaveBeenCalled()
})

it('rejects invalid input before requesting VK', async () => {
  await session()
  const network = vi.fn()
  vi.stubGlobal('fetch', network)
  const { vkPlaylists } = await import('@vk-audiopad/common')
  await expect(vkPlaylists.createPlaylist('1', '  ', '')).rejects.toThrow()
  await expect(vkPlaylists.createPlaylist('1', 'Saved', '', ['invalid'])).rejects.toThrow()
  await expect(vkPlaylists.addTrackToPlaylist('1', '-1', '1_20')).rejects.toThrow()
  expect(network).not.toHaveBeenCalled()
})

it('creates an empty playlist without inventing audio IDs', async () => {
  await session()
  const network = vi.fn(async (_input: string, _init?: RequestInit) => Response.json({ response: saved }))
  vi.stubGlobal('fetch', network)
  const { vkPlaylists } = await import('@vk-audiopad/common')
  expect(await vkPlaylists.createPlaylist('1', 'Saved', '')).toMatchObject({ id: '10', count: 0 })
  expect(new URLSearchParams(String(network.mock.calls[0][1]?.body)).has('audio_ids')).toBe(false)
})

it('does not retry a playlist mutation if authorization refresh changes accounts', async () => {
  await session()
  const network = vi.fn(async (input: string) => Response.json(input.includes('login.vk.ru')
    ? { type: 'okay', data: { user_id: 2, access_token: 'synthetic-other-account', expires: Number.MAX_SAFE_INTEGER, logout_hash: '' } }
    : { error: { error_code: 5 } }))
  vi.stubGlobal('fetch', network)
  const { vkPlaylists } = await import('@vk-audiopad/common')
  await expect(vkPlaylists.createPlaylist('1', 'Saved', '')).rejects.toThrow()
  expect(network).toHaveBeenCalledTimes(2)
  expect(network.mock.calls.filter(([input]) => input.includes('createPlaylist'))).toHaveLength(1)
})

it.each(['create', 'add'] as const)('rejects a late %s result after the initiating session epoch is retired', async action => {
  const browser = await session()
  const network = controlledFetch()
  const { vkPlaylists } = await import('@vk-audiopad/common')
  const pending = action === 'create'
    ? vkPlaylists.createPlaylist('1', 'Saved', '')
    : vkPlaylists.addTrackToPlaylist('1', '10', '-2_20')
  const rejected = expect(pending).rejects.toMatchObject({ kind: 'session-changed' })
  await vi.waitFor(() => { expect(network.requests).toHaveLength(1) })
  await browser.api.storage.local.set({ sessionEpoch: 'retired-playlist-session' })
  await rejected
  expect(network.requests[0].init?.signal?.aborted).toBe(true)
  network.requests[0].resolve(Response.json({ response: action === 'create' ? saved : [{ audio_id: 20 }] }))
  await Promise.resolve()
  expect(network.requests).toHaveLength(1)
})

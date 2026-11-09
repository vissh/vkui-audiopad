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
  expect(Object.fromEntries(new URLSearchParams(String(call.init?.body)))).toMatchObject({ owner_id: '1', title: 'Saved', description: 'Description', audio_ids: '1_20,-2_10_key' })
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

it('includes owned, followed and release playlists in the library while retaining an owned-only picker', async () => {
  await session()
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ response: { count: 3, items: [saved, { ...saved, id: 11, original: { owner_id: -2, playlist_id: 5 } }, { ...saved, id: 12, type: 'album' }] } })))
  const { vkPlaylists } = await import('@vk-audiopad/common')
  expect((await vkPlaylists.getPlaylists('1', 0, undefined, 'library')).items.map(item => [item.id, item.editable, item.isAlbum])).toEqual([['10', true, false], ['11', false, false], ['12', false, true]])
  expect((await vkPlaylists.getPlaylists('1')).items.map(item => item.id)).toEqual(['10'])
})

it('replaces a complete playlist in one validated request, including order, access keys and discovery visibility', async () => {
  await session()
  const network = vi.fn(async (_input: string, _init?: RequestInit) => Response.json({ response: 1 }))
  vi.stubGlobal('fetch', network)
  const { vkPlaylists } = await import('@vk-audiopad/common')
  await vkPlaylists.editPlaylist('1', '10', ' Edited ', 'Details', ['-2_20_key', '1_10'], true)
  expect(network.mock.calls[0][0]).toContain('/audio.editPlaylist?')
  expect(Object.fromEntries(new URLSearchParams(String(network.mock.calls[0][1]?.body)))).toMatchObject({ owner_id: '1', playlist_id: '10', title: 'Edited', description: 'Details', audio_ids: '-2_20_key,1_10', no_discover: '1' })
  await vkPlaylists.editPlaylist('1', '10', 'Empty', '', [])
  expect(new URLSearchParams(String(network.mock.calls[1][1]?.body)).get('audio_ids')).toBe('')
})

it.each([0, {}, { success: 1 }, null])('rejects an ambiguous edit without replay: %j', async response => {
  await session()
  const network = vi.fn(async () => Response.json({ response }))
  vi.stubGlobal('fetch', network)
  const { vkPlaylists } = await import('@vk-audiopad/common')
  await expect(vkPlaylists.editPlaylist('1', '10', 'Edited', '', [])).rejects.toThrow('format')
  expect(network).toHaveBeenCalledOnce()
})

it('paginates raw playlist tracks and rejects a stalled or malformed page', async () => {
  await session()
  const network = vi.fn(async (_input: string, _init?: RequestInit) => Response.json({ response: { count: 2, items: [{ owner_id: -2, id: 20, artist: 'Artist', title: 'Track', duration: 60, access_key: 'key' }] } }))
  vi.stubGlobal('fetch', network)
  const { vkPlaylists } = await import('@vk-audiopad/common')
  expect(await vkPlaylists.getTracks('1', '10')).toMatchObject({ items: [{ id: '-2_20', accessKey: 'key', title: 'Track' }], nextOffset: 1 })
  expect(new URLSearchParams(String(network.mock.calls[0][1]?.body)).get('album_id')).toBe('10')
  network.mockResolvedValueOnce(Response.json({ response: { count: 2, items: [] } }))
  await expect(vkPlaylists.getTracks('1', '10', 1)).rejects.toThrow('format')
})

it('rejects metadata for followed or foreign playlists before editing', async () => {
  await session()
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ response: { ...saved, original: { owner_id: -2, playlist_id: 5 } } })))
  const { vkPlaylists } = await import('@vk-audiopad/common')
  await expect(vkPlaylists.getPlaylist('1', '10')).rejects.toThrow('format')
})

it('validates deletion and rejects an old-account edit before dispatch', async () => {
  await session()
  const network = vi.fn(async (_input: string) => Response.json({ response: 1 }))
  vi.stubGlobal('fetch', network)
  const { vkPlaylists } = await import('@vk-audiopad/common')
  await vkPlaylists.deletePlaylist('1', '10')
  expect(network.mock.calls[0][0]).toContain('audio.deletePlaylist')
  await expect(vkPlaylists.editPlaylist('2', '10', 'Edited', '', [])).rejects.toThrow()
  expect(network).toHaveBeenCalledOnce()
})

it('follows and unfollows a radio station with validated account-bound requests', async () => {
  await session()
  const network = vi.fn(async (_input: string, _init?: RequestInit) => Response.json({ response: 1 }))
  vi.stubGlobal('fetch', network)
  const { vkApiClient } = await import('@vk-audiopad/common')
  await vkApiClient.setRadioStationFollowed('1', '24', true)
  await vkApiClient.setRadioStationFollowed('1', '24', false)
  expect(network.mock.calls.map(([url]) => new URL(url).pathname)).toEqual(['/method/audio.followRadioStation', '/method/audio.unfollowRadioStation'])
  expect(new URLSearchParams(String(network.mock.calls[0][1]?.body)).get('station_id')).toBe('24')
  network.mockResolvedValueOnce(Response.json({ response: 0 }))
  await expect(vkApiClient.setRadioStationFollowed('1', '24', true)).rejects.toThrow('format')
})

it('follows a token-source playlist with its access key and validates follow/unfollow confirmation', async () => {
  await session()
  const network = vi.fn(async (url: string, _init?: RequestInit) => Response.json({ response: url.includes('followPlaylist') ? { owner_id: 1, playlist_id: 30 } : 1 }))
  vi.stubGlobal('fetch', network)
  const { vkPlaylists } = await import('@vk-audiopad/common')
  const source = vkPlaylists.toPlaybackPlaylist({ ...saved, id: '20', ownerId: '-2', accessKey: 'source-key' })
  const followed = await vkPlaylists.setFollowed('1', source, true)
  expect(followed).toEqual({ followed: true, followedPlaylist: { ownerId: '1', id: '30' } })
  expect(new URLSearchParams(String(network.mock.calls[0][1]?.body)).get('access_key')).toBe('source-key')
  expect(await vkPlaylists.setFollowed('1', { ...source, followedPlaylist: followed.followedPlaylist }, false)).toEqual({ followed: false })
  expect(Object.fromEntries(new URLSearchParams(String(network.mock.calls[1][1]?.body)))).toMatchObject({ owner_id: '1', playlist_id: '30' })
  network.mockResolvedValueOnce(Response.json({ response: {} }))
  await expect(vkPlaylists.setFollowed('1', source, true)).rejects.toThrow('format')
})

it('resolves a followed copy from the complete library before removing a token-source subscription', async () => {
  await session()
  const network = vi.fn(async (url: string, _init?: RequestInit) => Response.json({ response: url.includes('getPlaylists') ? { count: 1, items: [{ ...saved, id: 30, original: { owner_id: -2, playlist_id: 20 } }] } : 1 }))
  vi.stubGlobal('fetch', network)
  const { vkPlaylists } = await import('@vk-audiopad/common')
  const source = vkPlaylists.toPlaybackPlaylist({ ...saved, id: '20', ownerId: '-2', accessKey: '' })
  expect(await vkPlaylists.setFollowed('1', source, false)).toEqual({ followed: false })
  expect(Object.fromEntries(new URLSearchParams(String(network.mock.calls[1][1]?.body)))).toMatchObject({ owner_id: '1', playlist_id: '30' })
  expect(network).toHaveBeenCalledTimes(2)
})

it('loads missing queue metadata in bounded batches while retaining access keys', async () => {
  await session()
  const batches: string[][] = []
  vi.stubGlobal('fetch', vi.fn(async (_input: string, init?: RequestInit) => {
    const ids = new URLSearchParams(String(init?.body)).get('audios')!.split(',')
    batches.push(ids)
    return Response.json({ response: ids.map(id => ({ id: Number(id.split('_')[1]), owner_id: 1, title: `Song ${id}`, artist: 'Artist', duration: 30 })) })
  }))
  const { vkPlaylists } = await import('@vk-audiopad/common')
  const ids = Array.from({ length: 101 }, (_, index) => `1_${index + 1}_source-key`)
  const tracks = await vkPlaylists.getTracksByIds('1', ids)
  expect(batches.map(batch => batch.length)).toEqual([100, 1])
  expect(batches.flat()).toEqual(ids)
  expect(tracks).toHaveLength(101)
  expect(tracks[100]).toMatchObject({ id: '1_101', title: 'Song 1_101_source-key' })
})

it('rejects malformed metadata responses and invalid queue IDs', async () => {
  await session()
  const network = vi.fn(async () => Response.json({ response: {} }))
  vi.stubGlobal('fetch', network)
  const { vkPlaylists } = await import('@vk-audiopad/common')
  await expect(vkPlaylists.getTracksByIds('1', ['broken'])).rejects.toThrow('format')
  expect(network).not.toHaveBeenCalled()
  await expect(vkPlaylists.getTracksByIds('1', ['1_10'])).rejects.toThrow('format')
})

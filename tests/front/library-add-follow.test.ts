import { expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { playlist, track } from '../helpers/playback'

it('preserves visible track metadata when a token API addition returns a new library ID', async () => {
  createChrome({ userId: '1', webToken: { userId: '1', accessToken: 'synthetic', expires: Number.MAX_SAFE_INTEGER, logoutHash: '', error: null } })
  const { startSessionService } = await import('../../packages/service-worker/src/session')
  startSessionService()
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"response":{"items_count":1,"errors_count":0,"items":[{"new_owner_id":1,"new_audio_id":100}],"errors":[]}}')))
  const { vkApiAdd } = await import('../../packages/front/src/features/add-to-my-music/api/add')
  const source = { ...track('-2_10'), title: 'Original title', artist: 'Original artist', fromAct: false }
  const added = await vkApiAdd(source)
  expect(added.id).toBe('1_100')
  expect(added.title).toBe(source.title)
  expect(added.artist).toBe(source.artist)
  expect(added.duration).toBe(source.duration)
  expect(source.id).toBe('-2_10')
})

it('rejects a partial add error instead of marking the row successful', async () => {
  createChrome({ userId: '1', webToken: { userId: '1', accessToken: 'synthetic', expires: Number.MAX_SAFE_INTEGER, logoutHash: '', error: null } })
  const { startSessionService } = await import('../../packages/service-worker/src/session')
  startSessionService()
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"response":{"items_count":1,"errors_count":1,"items":[{"new_owner_id":1,"new_audio_id":100}],"errors":[{"message":"synthetic-private-value"}]}}')))
  const { vkApiAdd } = await import('../../packages/front/src/features/add-to-my-music/api/add')
  await expect(vkApiAdd({ ...track('-2_10'), fromAct: false })).rejects.toThrow()
})

it.each(['add', 'follow'])('does not replay an ambiguous legacy %s mutation', async action => {
  createChrome()
  const network = vi.fn(async () => new Response('not json'))
  vi.stubGlobal('fetch', network)
  const pending = action === 'add'
    ? (await import('../../packages/front/src/features/add-to-my-music/api/add')).vkApiAdd(track('-2_10'))
    : (await import('../../packages/front/src/features/follow-album/api/follow')).vkApiFollow(playlist([]))
  await expect(pending).rejects.toThrow()
  expect(network).toHaveBeenCalledOnce()
})

it('does not interpret a missing follow state as successful unfollow', async () => {
  createChrome()
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"payload":[0,[{}]]}')))
  const { vkApiFollow } = await import('../../packages/front/src/features/follow-album/api/follow')
  await expect(vkApiFollow(playlist([]))).rejects.toThrow()
})

it('does not expose a malformed legacy add payload in its error', async () => {
  createChrome()
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"payload":[0,["synthetic-private-value"]]}')))
  const { vkApiAdd } = await import('../../packages/front/src/features/add-to-my-music/api/add')
  await expect(vkApiAdd(track('-2_10'))).rejects.toThrow('VK audio addition failed')
})

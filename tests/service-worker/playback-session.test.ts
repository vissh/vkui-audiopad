import { commonUtils, type commonTypes } from '@vk-audiopad/common'
import { afterEach, expect, it, vi } from 'vitest'
import { clearPlaybackMocks, playbackHarness, playlist, track } from '../helpers/playback'
import { deferred } from '../helpers/deferred'

afterEach(clearPlaybackMocks)

it.each(['account', 'epoch', 'logout'])('rejects a delayed legacy source after a session %s change', async change => {
  const player = await playbackHarness({ userId: '1', sessionEpoch: 'one' }, { realState: true })
  const { loadState } = await import('../../packages/service-worker/src/state')
  await loadState()
  const late = deferred<commonTypes.TrackItem | null>()
  player.fetchTrack.mockImplementationOnce(async () => await late.promise)
  const starting = player.playNewTrack('1_1', playlist(['1_1']))
  await vi.waitFor(() => { expect(player.fetchTrack).toHaveBeenCalledOnce() })
  await commonUtils.clearStorage(['sessionEpoch'])
  await player.api.storage.local.set({ userId: change === 'account' ? '2' : change === 'logout' ? '' : '1', sessionEpoch: 'two' })
  late.resolve(track('1_1'))
  await starting
  expect(player.play).not.toHaveBeenCalled()
  expect(player.snapshot()).not.toHaveProperty('currentPlaylist')
  expect(player.snapshot()).not.toHaveProperty('activeTrack')
})

it('retires queued playback writes before the session cleanup uses the same writer', async () => {
  const player = await playbackHarness({ userId: '1', sessionEpoch: 'one' })
  const { serializeStateWrite } = await import('../../packages/service-worker/src/state-writer')
  const { retirePlayback, commitPlayback, getPlaybackOperation, isRunningPlayback, beginPlayback } = await import('../../packages/service-worker/src/playback-operation')
  const operation = beginPlayback('1_1', playlist(['1_1']), [['1_1', '']])
  const wait = deferred<void>()
  const blocking = serializeStateWrite(async () => { await wait.promise })
  const transition = serializeStateWrite(async () => {
    retirePlayback()
    await commonUtils.clearStorage()
    await player.api.storage.local.set({ userId: '2', sessionEpoch: 'two' })
  })
  const stale = commitPlayback(() => isRunningPlayback(operation), { activeTrack: track('1_1') })
  wait.resolve()
  await Promise.all([blocking, transition, stale])
  expect(await stale).toBe(false)
  expect(getPlaybackOperation()).toBeNull()
  expect(player.snapshot()).not.toHaveProperty('activeTrack')
})

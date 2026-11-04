import { initialState } from '@vk-audiopad/common'
import { expect, it } from 'vitest'
import { applyQueueEdits, editQueue, insertNext, removeFromQueue, shuffleQueue } from '../../packages/service-worker/src/queue'
import { playlist, track } from '../helpers/playback'

const state = (visible: string[], full = visible, active = 'B', original: string[] = []) => ({
  ...initialState.Application,
  currentPlaylist: playlist(visible),
  activeTrack: track(active),
  audiosIds: full.map((id): [string, string] => [id, `key-${id}`]),
  originalAudiosIds: original.map((id): [string, string] => [id, `key-${id}`])
})

it.each([
  { visible: ['A', 'B'], full: ['A', 'B', 'C'], expected: ['A', 'B', 'D', 'C'], shown: ['A', 'B', 'D'] },
  { visible: ['A', 'B'], full: ['A', 'B'], expected: ['A', 'B', 'D'], shown: ['A', 'B', 'D'] },
  { visible: ['D', 'A', 'B', 'D'], full: ['D', 'A', 'B', 'D'], expected: ['A', 'B', 'D'], shown: ['A', 'B', 'D'] },
  { visible: ['A'], full: ['A', 'B', 'C'], expected: ['A', 'B', 'D', 'C'], shown: ['A', 'D'] },
  { visible: ['A'], full: ['A'], expected: ['D', 'A'], shown: ['D', 'A'] },
  { visible: [], full: [], expected: ['D'], shown: ['D'] }
])('inserts next without wrapping or mixing collection indexes: $full', ({ visible, full, expected, shown }) => {
  const before = state(visible, full)
  const saved = structuredClone(before)
  const result = insertNext(before, track('D'))
  expect(result?.changes.audiosIds?.map(([id]) => id)).toEqual(expected)
  expect(result?.changes.currentPlaylist?.tracks.map(item => item.id)).toEqual(shown)
  expect(before).toEqual(saved)
})

it('inserts independently into playback, restore order and loaded metadata while shuffled', () => {
  const before = state(['A', 'B'], ['C', 'B', 'A'], 'B', ['A', 'B', 'C'])
  const result = insertNext(before, track('D'))
  expect(result?.changes.audiosIds?.map(([id]) => id)).toEqual(['C', 'B', 'D', 'A'])
  expect(result?.changes.originalAudiosIds?.map(([id]) => id)).toEqual(['A', 'B', 'D', 'C'])
  expect(result?.changes.currentPlaylist?.tracks.map(item => item.id)).toEqual(['A', 'B', 'D'])
})

it('ignores the active track as a play-next candidate, matching the UI restriction', () => {
  expect(insertNext(state(['A', 'B']), track('B'))).toBeNull()
})

it('moves by stable source and destination ids without disturbing unloaded tails', () => {
  const before = state(['A', 'B', 'C'], ['A', 'X', 'B', 'C', 'Z'])
  const result = editQueue(before, playlist(['A', 'B', 'C']), playlist(['B', 'C', 'A']), [['move', 0, 2]])
  expect(result?.changes.audiosIds?.map(([id]) => id)).toEqual(['X', 'B', 'C', 'A', 'Z'])
  expect(result?.changes.activeTrackIndex).toBe(1)
})

it('reorders only restore order during shuffle but removes from every collection', () => {
  const before = state(['A', 'B', 'C'], ['C', 'B', 'A', 'X'], 'B', ['A', 'X', 'B', 'C'])
  const result = editQueue(before, playlist(['A', 'B', 'C']), playlist(['C', 'A']), [['move', 2, 0], ['remove', 2]])
  expect(result?.changes.audiosIds?.map(([id]) => id)).toEqual(['C', 'A', 'X'])
  expect(result?.changes.originalAudiosIds?.map(([id]) => id)).toEqual(['C', 'A', 'X'])
  expect(result?.changes.activeTrackIndex).toBe(-1)
})

it('keeps shuffled playback order while a draft moves a loaded track', () => {
  const before = state(['A', 'B', 'C'], ['B', 'C', 'A', 'X'], 'B', ['A', 'X', 'B', 'C'])
  const result = editQueue(before, playlist(['A', 'B', 'C']), playlist(['B', 'C', 'A']), [['move', 0, 2]])
  expect(result?.changes.audiosIds).toEqual(before.audiosIds)
  expect(result?.changes.originalAudiosIds?.map(([id]) => id)).toEqual(['X', 'B', 'C', 'A'])
  expect(result?.changes.activeTrackIndex).toBe(0)
})

it.each([-1, 3, 0.5, NaN])('rejects an invalid edit index %s without partial changes', index => {
  const before = state(['A', 'B', 'C'])
  expect(editQueue(before, playlist(['A', 'B', 'C']), playlist(['A', 'C']), [['remove', index]])).toBeNull()
  expect(before.currentPlaylist.tracks.map(item => item.id)).toEqual(['A', 'B', 'C'])
})

it('rejects stale drafts and a proposed order inconsistent with its actions', () => {
  expect(editQueue(state(['A', 'D', 'B']), playlist(['A', 'B']), playlist(['B', 'A']), [['move', 0, 1]])).toBeNull()
  expect(editQueue(state(['A', 'B']), playlist(['A', 'B']), playlist(['A', 'B']), [['move', 0, 1]])).toBeNull()
})

it('ignores absent ids rather than splicing the last entry', () => {
  const before = state(['A', 'B'])
  expect(removeFromQueue(before, 'missing')?.changes.audiosIds).toEqual(before.audiosIds)
  expect(applyQueueEdits(before.audiosIds, [{ type: 'move', id: 'missing', anchorId: 'B', after: true }])).toEqual(before.audiosIds)
})

it('preserves selection and canonical keys across repeated shuffle and restore', () => {
  const before = state(['A', 'B', 'C'])
  const shuffled = shuffleQueue(before, true, ids => [...ids].reverse())
  expect(shuffled.changes.audiosIds?.map(([id]) => id)).toEqual(['C', 'B', 'A'])
  const after = { ...before, ...shuffled.changes }
  expect(shuffleQueue(after, true, () => { throw new Error('Already shuffled') }).changes.audiosIds).toEqual(after.audiosIds)
  const restored = shuffleQueue(after, false, ids => ids)
  expect(restored.changes.audiosIds).toEqual(before.audiosIds)
  expect(restored.changes.originalAudiosIds).toEqual([])
  expect(restored.changes.activeTrackIndex).toBe(1)
})

it('can restore when no backup exists and leaves an absent active track at -1', () => {
  const before = state(['A', 'C'])
  const result = shuffleQueue(before, false, ids => ids)
  expect(result.changes.audiosIds).toEqual(before.audiosIds)
  expect(result.changes.activeTrackIndex).toBe(-1)
})

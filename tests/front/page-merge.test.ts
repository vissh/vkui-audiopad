import { expect, it } from 'vitest'
import { canAppendPlaylist, mergeAlbums, mergeCatalogBlocks, mergePlaylistPage } from '../../packages/front/src/shared/lib/pagination'
import { CatalogBlockDataType } from '../../packages/front/src/shared/types'
import { playlist, track } from '../helpers/playback'

it('deduplicates a playlist page without mutating either snapshot and keeps updated metadata', () => {
  const previous = playlist(['1_1', '1_2'])
  const next = { ...playlist(['1_2', '1_3']), nextOffset: 'B' }
  next.tracks[0] = { ...track('1_2'), title: 'updated' }
  Object.freeze(previous.tracks)
  Object.freeze(next.tracks)
  const merged = mergePlaylistPage(previous, next)
  expect(merged.tracks.map(item => item.id)).toEqual(['1_1', '1_2', '1_3'])
  expect(merged.tracks[1].title).toBe('updated')
  expect(merged.nextOffset).toBe('B')
  expect(previous.tracks.map(item => item.id)).toEqual(['1_1', '1_2'])
  expect(next.tracks.map(item => item.id)).toEqual(['1_2', '1_3'])
})

it.each(['ownerId', 'id', 'blockId', 'nextOffset'] as const)('rejects a page whose original %s has changed', field => {
  const base = playlist(['1_1'])
  const current = { ...base, [field]: 'changed' }
  expect(canAppendPlaylist(current, base, playlist(['1_2']))).toBe(false)
})

it('rejects an unrelated result and merges repeated catalog blocks with stable track IDs', () => {
  const base = playlist(['1_1', '1_2'])
  expect(canAppendPlaylist(base, base, { ...base, ownerId: 'other' })).toBe(false)
  const previous = [{ blockId: 'block', dataType: CatalogBlockDataType.TRACKS as const, playlist: base }]
  const next = [{ blockId: 'block', dataType: CatalogBlockDataType.TRACKS as const, playlist: playlist(['1_2', '1_3']) }]
  const merged = mergeCatalogBlocks(previous, next)
  expect(merged).toHaveLength(1)
  expect(merged[0].dataType === CatalogBlockDataType.TRACKS && merged[0].playlist.tracks.map(track => track.id)).toEqual(['1_1', '1_2', '1_3'])
  expect(previous[0].playlist.tracks).toHaveLength(2)
})

it('keeps equal album IDs from different owners distinct', () => {
  const album = (ownerId: string) => ({ ...playlist([], 'same'), ownerId, coverUrl: '', gridCoverUrls: [], authorLine: '', authorName: '', infoLine: '' })
  expect(mergeAlbums([album('1')], [album('1'), album('2')]).map(item => item.ownerId)).toEqual(['1', '2'])
})

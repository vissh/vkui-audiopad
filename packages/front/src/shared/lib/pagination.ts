import { type commonTypes } from '@vk-audiopad/common'
import { CatalogBlockDataType, type Album, type CatalogBlock } from '../types'

export const mergeByKey = <T>(previous: readonly T[], next: readonly T[], key: (item: T) => string, merge: (previous: T, next: T) => T = (_previous, next) => next): T[] => {
  const values = new Map<string, T>()
  for (const item of [...previous, ...next]) {
    const id = key(item)
    const existing = values.get(id)
    values.set(id, existing == null ? item : merge(existing, item))
  }
  return [...values.values()]
}

export const samePlaylist = (left: commonTypes.Playlist, right: commonTypes.Playlist): boolean => left.id === right.id && left.ownerId === right.ownerId && left.blockId === right.blockId

export const canAppendPlaylist = (current: commonTypes.Playlist, base: commonTypes.Playlist, next: commonTypes.Playlist): boolean => samePlaylist(current, base) && samePlaylist(base, next) && current.nextOffset === base.nextOffset

export const mergePlaylistPage = (previous: commonTypes.Playlist, next: commonTypes.Playlist): commonTypes.Playlist => ({
  ...next,
  tracks: mergeByKey(previous.tracks, next.tracks, track => track.id)
})

export const mergeAlbums = (previous: readonly Album[], next: readonly Album[]): Album[] => mergeByKey(previous, next, album => JSON.stringify([album.ownerId, album.id]))

export const mergeCatalogBlocks = (previous: readonly CatalogBlock[], next: readonly CatalogBlock[]): CatalogBlock[] => mergeByKey(previous, next, block => block.blockId, (previous, next) => {
  if (previous.dataType === CatalogBlockDataType.TRACKS || next.dataType === CatalogBlockDataType.TRACKS) {
    return previous.dataType === CatalogBlockDataType.TRACKS && next.dataType === CatalogBlockDataType.TRACKS && samePlaylist(previous.playlist, next.playlist)
      ? { ...next, playlist: mergePlaylistPage(previous.playlist, next.playlist) }
      : next
  }
  return { ...next, albums: mergeAlbums(previous.albums, next.albums) }
})

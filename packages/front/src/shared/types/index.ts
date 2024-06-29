import { type commonTypes } from '@vk-audiopad/common'

export enum CatalogBlockDataType {
  TRACKS = 'tracks',
  ALBUMS = 'albums',
  RECOMMENDATIONS = 'recommendations',
  VIBES = 'vibes',
}

export type Album = commonTypes.Playlist & {
  coverUrl: string
  gridCoverUrls: string[]
  authorLine: string
  authorName: string
  infoLine: string
}

export interface TracksCatalogBlock {
  blockId: string
  dataType: CatalogBlockDataType.TRACKS
  playlist: commonTypes.Playlist
}

export interface AlbumsCatalogBlock {
  blockId: string
  dataType: CatalogBlockDataType.ALBUMS
  title: string
  albums: Album[]
  showAllLink: string
}

export interface RecommendationsCatalogBlock {
  blockId: string
  dataType: CatalogBlockDataType.RECOMMENDATIONS
  title: string
  albums: Album[]
  showAllLink: string
}

export interface VibesCatalogBlock {
  blockId: string
  dataType: CatalogBlockDataType.VIBES
  title: string
  albums: Album[]
  showAllLink: string
}

export type CatalogBlock = TracksCatalogBlock | AlbumsCatalogBlock | RecommendationsCatalogBlock | VibesCatalogBlock

export interface ParsedAlbumInfo {
  id: string
  subtitle: string
}

export interface ParsedCatalogBlock {
  blockId: string
  title: string
  dataType: CatalogBlockDataType
  showAllLink: string
  parsedAlbums: ParsedAlbumInfo[]
}

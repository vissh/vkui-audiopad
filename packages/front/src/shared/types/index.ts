import { type commonTypes } from '@vk-audiopad/common'

export enum CatalogBlockDataType {
  TRACKS = 'tracks',
  ALBUMS = 'albums',
  RECOMMENDATIONS = 'recommendations',
  VIBES = 'vibes',
  BANNERS = 'banners',
  LINKS = 'links'
}

export type Album = commonTypes.Playlist & {
  coverUrl: string
  gridCoverUrls: string[]
  authorLine: string
  authorName: string
  trackCount?: number
  playCount?: number
  authorAvatarUrl?: string
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
  library?: boolean
}

export interface RecommendationsCatalogBlock {
  blockId: string
  dataType: CatalogBlockDataType.RECOMMENDATIONS
  title: string
  albums: Album[]
  showAllLink: string
  library?: boolean
}

export interface VibesCatalogBlock {
  blockId: string
  dataType: CatalogBlockDataType.VIBES
  title: string
  albums: Album[]
  showAllLink: string
  library?: boolean
}

export interface BannersCatalogBlock {
  blockId: string
  dataType: CatalogBlockDataType.BANNERS
  title: string
  albums: Album[]
  showAllLink: string
  library?: boolean
}

export interface CatalogLinkItem {
  id: string
  title: string
  subtitle: string
  href: string
  image: string
  colors: string[]
  foreground: boolean
  foregroundImage?: string
  mixId?: string
  mixOptions?: string
  mixEntityId?: string
  artist?: commonTypes.TrackArtist
  friendOwnerId?: string
  playlist?: commonTypes.Playlist
}

export interface LinksCatalogBlock {
  blockId: string
  dataType: CatalogBlockDataType.LINKS
  title: string
  links: CatalogLinkItem[]
  showAllLink: string
  layout: 'categories' | 'banners' | 'friends' | 'mixes' | 'artists'
}

export type CatalogBlock = TracksCatalogBlock | AlbumsCatalogBlock | RecommendationsCatalogBlock | VibesCatalogBlock | BannersCatalogBlock | LinksCatalogBlock

export interface ParsedAlbumInfo {
  id: string
  img: string
  title: string
  subtitle: string
  text: string
  subtext: string
  authorAvatarUrl?: string
}

export interface ParsedCatalogBlock {
  blockId: string
  title: string
  dataType: CatalogBlockDataType
  showAllLink: string
  parsedAlbums: ParsedAlbumInfo[]
}

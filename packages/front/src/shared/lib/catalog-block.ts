import { cast, vkClient, type commonTypes } from '@vk-audiopad/common'
import {
  CatalogBlockDataType,
  type Album,
  type AlbumsCatalogBlock,
  type BannersCatalogBlock,
  type CatalogBlock,
  type ParsedCatalogBlock,
  type RecommendationsCatalogBlock,
  type TracksCatalogBlock
} from '../types'
import { toAlbum, toTitlePlaylist } from './cast-to-types'
import { parseCatalogBlocks } from './parse-html-block'

export const isAlbumsCatalogBlock = (block: CatalogBlock | null): block is AlbumsCatalogBlock => {
  if (block == null) {
    return false
  }
  return block.dataType === CatalogBlockDataType.ALBUMS
}

export const isTracksCatalogBlock = (block: CatalogBlock | null): block is TracksCatalogBlock => {
  if (block == null) {
    return false
  }
  return block.dataType === CatalogBlockDataType.TRACKS
}

export const getCatalogBlocks = (resp: commonTypes.VKApiResponse): CatalogBlock[] => {
  const playlistsPayload = cast.castToJSONObject(vkClient.parseResponsePayload(resp, [1, 1]))
  const blockIds: string[] = cast.castToArray(playlistsPayload.blockIds).map(cast.safeCastToString)

  const html = getHtmlSection(resp)
  const parsedCatalogBlocks = parseCatalogBlocks(blockIds, html)

  const playlists = cast.castToArray(playlistsPayload.playlists)
    .map(playlist => cast.castToJSONObject(playlist))

  const blocksWithTracks = Array.from(playlists)
    .filter(playlist => cast.safeCastToArray(playlist.list).length > 0)
    .reduce((result: Record<string, commonTypes.Playlist>, playlist) => {
      const blockId = cast.safeCastToString(playlist.blockId)
      result[blockId] = toTitlePlaylist(playlist)
      return result
    }, {})

  const albums = Array.from(playlists)
    .reduce((result: Record<string, Album>, playlist) => {
      const ownerId = cast.safeCastToString(playlist.ownerId)
      const playlistId = cast.safeCastToString(playlist.id)
      const albumId = `${ownerId}_${playlistId}`
      result[albumId] = toAlbum(playlist)
      return result
    }, {})

  const resultCatalogBlocks: CatalogBlock[] = parsedCatalogBlocks
    .filter((parsedCatalogBlock) => {
      return parsedCatalogBlock.dataType === CatalogBlockDataType.TRACKS ? blocksWithTracks[parsedCatalogBlock.blockId] != null : true
    })
    .map((parsedCatalogBlock) => (
      parsedCatalogBlock.dataType === CatalogBlockDataType.TRACKS
        ? toTracksCatalogBlock(parsedCatalogBlock, blocksWithTracks)
        : toAlbumsCatalogBlock(parsedCatalogBlock, albums)
    ))

  const recommendationsBlock = getRecommendationsCatalogBlock(playlists)
  if (recommendationsBlock.albums.length > 0) {
    resultCatalogBlocks.splice(1, 0, recommendationsBlock)
  }

  return resultCatalogBlocks
}

const getHtmlSection = (resp: commonTypes.VKApiResponse): string => {
  let html = vkClient.parseResponsePayload(resp, [1, 0])
  if (Array.isArray(html)) {
    html = html.join('')
  } else if (typeof html !== 'string') {
    throw new Error(`getHtmlSection: Unexpected type ${typeof html} with value ${JSON.stringify(html)}`)
  }
  return html
}

const toTracksCatalogBlock = (
  parsedCatalogBlock: ParsedCatalogBlock,
  blocksWithTracks: Record<string, commonTypes.Playlist>
): TracksCatalogBlock => {
  return {
    blockId: parsedCatalogBlock.blockId,
    dataType: CatalogBlockDataType.TRACKS,
    playlist: blocksWithTracks[parsedCatalogBlock.blockId]
  }
}

const toAlbumsCatalogBlock = (parsedCatalogBlocks: ParsedCatalogBlock, albums: Record<string, Album>): AlbumsCatalogBlock | BannersCatalogBlock => {
  const blockId = parsedCatalogBlocks.blockId
  const title = parsedCatalogBlocks.title

  const isBanner = parsedCatalogBlocks.parsedAlbums.filter((pl) => pl.img !== '').length > 0

  return {
    dataType: isBanner ? CatalogBlockDataType.BANNERS : CatalogBlockDataType.ALBUMS,
    title,
    blockId,
    albums: parsedCatalogBlocks.parsedAlbums.map((pl) => {
      if (isBanner) {
        const [ownerId, playlistId, accessHash] = pl.id.split('_')
        return {
          id: playlistId,
          blockId,
          title: pl.title,
          tracks: [],
          isRadio: false,
          isVkMix: false,
          accessHash,
          ownerId,
          nextOffset: '',
          hasMore: false,
          followHash: '',
          isFollowed: false,
          coverUrl: pl.img,
          gridCoverUrls: [pl.img],
          authorLine: pl.title,
          authorName: pl.text,
          infoLine: pl.subtext
        }
      } else {
        const album = albums[pl.id]
        album.blockId = blockId
        album.infoLine = pl.subtitle
        return album
      }
    }),
    showAllLink: parsedCatalogBlocks.showAllLink
  }
}

const getRecommendationsCatalogBlock = (playlists: commonTypes.JSONObject[]): RecommendationsCatalogBlock => {
  return {
    blockId: 'recommendation-block-id',
    dataType: CatalogBlockDataType.RECOMMENDATIONS,
    title: 'Собрано алгоритмами',
    albums: playlists
      .filter((playlist) => playlist.is_generated_playlist === true)
      .map((playlist) => toAlbum(playlist)),
    showAllLink: ''
  }
}

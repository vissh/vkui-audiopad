import { cast, catalogLink, vkApiClient, vkClient } from '@vk-audiopad/common'
import { getCatalogBlocks } from '@/shared/lib/catalog-block'
import { type FetchAlbumsResult, type FetchNextSectionArgs } from '../model/types'

export const fetchAlbums = async (showAllLink: string): Promise<FetchAlbumsResult> => {
  const sectionId = await resolveSectionId(showAllLink)
  if (sectionId == null) {
    throw new Error('Albums sectionId not found')
  }

  return await fetchMoreAlbums({ nextFrom: '', sectionId })
}

const resolveSectionId = async (showAllLink: string): Promise<string | null> => {
  const token = catalogLink.sectionIdFromShowAllLink(showAllLink)
  if (token != null) {
    return token
  }

  const artistLink = catalogLink.parseArtistShowAllLink(showAllLink)
  if (artistLink != null) {
    return await vkApiClient.getArtistCatalogSectionId(artistLink.artistId, artistLink.url)
  }

  const audioSectionLink = catalogLink.parseAudioSectionShowAllLink(showAllLink)
  if (audioSectionLink != null) {
    return await vkApiClient.getAudioCatalogSectionId(audioSectionLink.url)
  }

  return null
}

export const fetchMoreAlbums = async (args: FetchNextSectionArgs): Promise<FetchAlbumsResult> => {
  const resp = await vkClient.request('https://vk.ru/al_audio.php?act=load_catalog_section', {
    al: '1',
    section_id: args.sectionId,
    start_from: args.nextFrom
  })

  const playlistsPayload = cast.castToJSONObject(vkClient.parseResponsePayload(resp, [1, 1]))

  return {
    nextFrom: cast.safeCastToString(playlistsPayload.nextFrom),
    sectionId: cast.safeCastToString(playlistsPayload.sectionId),
    blocks: getCatalogBlocks(resp)
  }
}

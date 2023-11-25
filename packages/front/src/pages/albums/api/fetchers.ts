import { cast, vkClient } from '@vk-audiopad/common'
import { getCatalogBlocks } from '@/shared/lib/catalog-block'
import { findSectionId } from '@/shared/lib/parse-html-block'
import { type FetchAlbumsResult, type FetchNextSectionArgs } from '../model/types'

export const fetchAlbums = async (showAllLink: string): Promise<FetchAlbumsResult> => {
  const resp = await fetch(`https://vk.com${showAllLink}`)
  const html = await resp.text()

  const sectionId = findSectionId(html)
  if (sectionId == null) {
    throw new Error('Albums sectionId not found')
  }

  return await fetchMoreAlbums({ nextFrom: '', sectionId })
}

export const fetchMoreAlbums = async (args: FetchNextSectionArgs): Promise<FetchAlbumsResult> => {
  const resp = await vkClient.request('https://vk.com/al_audio.php?act=load_catalog_section', {
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

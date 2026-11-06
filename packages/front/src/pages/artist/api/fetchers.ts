import { cast, vkApiClient, vkClient } from '@vk-audiopad/common'
import { fetchCatalogSection } from '@/shared/api'
import { getCatalogBlocks } from '@/shared/lib/catalog-block'
import { parseTokenCatalog } from '@/shared/lib/token-catalog'
import { parseFromString } from '@/shared/lib/utils'
import { CatalogBlockDataType, type CatalogBlock } from '@/shared/types'
import { type FetchArtistResult } from '../model/types'

export const fetchArtistData = async (artistId: string, signal?: AbortSignal): Promise<FetchArtistResult> => {
  const catalog = parseTokenCatalog(await vkApiClient.getArtistCatalog(artistId, signal))
  const page = catalog.blocks.length > 0 ? catalog : await fetchCatalogSection(catalog.sectionId, '', signal)
  signal?.throwIfAborted()
  let backgroundImage = ''
  let legacy: CatalogBlock[] = []
  try {
    const resp = await vkClient.request('https://vk.ru/al_audio.php?act=load_catalog_section', { al: '1', section_id: page.sectionId }, signal)
    backgroundImage = getBackgroundImage(cast.safeCastToString(vkClient.parseResponsePayload(resp, [1, 0, 0])))
    legacy = getCatalogBlocks(resp)
  } catch {
    signal?.throwIfAborted()
  }
  return {
    backgroundImage,
    blocks: page.blocks.map(block => {
      if (block.dataType !== CatalogBlockDataType.TRACKS) return block
      const match = legacy.find(item => item.dataType === CatalogBlockDataType.TRACKS && (item.blockId === block.blockId || item.playlist.title === block.playlist.title))
      return match?.dataType === CatalogBlockDataType.TRACKS ? { ...block, playlist: { ...block.playlist, tracks: match.playlist.tracks } } : block
    })
  }
}

const getBackgroundImage = (html: string): string => {
  const root = parseFromString(html)
  const coverElements = root.getElementsByClassName('MusicAuthor_block__cover')

  if (coverElements.length === 0) {
    return ''
  }

  return (coverElements[0] as HTMLDivElement).style.backgroundImage
}

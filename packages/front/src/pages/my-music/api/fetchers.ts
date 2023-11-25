import { vkClient } from '@vk-audiopad/common'
import { getCatalogBlocks, isTracksCatalogBlock } from '@/shared/lib/catalog-block'
import {
  type CatalogBlock,
  type TracksCatalogBlock
} from '@/shared/types'
import { type FetchMyMusicResult } from '../model/types'

export const fetchMyMusic = async (ownerId: string): Promise<FetchMyMusicResult> => {
  const resp = await vkClient.request('https://vk.com/al_audio.php?act=section', {
    act: 'section',
    al: '1',
    claim: '0',
    is_layer: '0',
    owner_id: ownerId,
    section: 'all'
  })

  const catalogBlocks = getCatalogBlocks(resp)
  const [firstBlock, ...otherBlocks] = catalogBlocks
  const lastTracksCatalogBlock = getLastTracksCatalogBlock(catalogBlocks)

  return {
    firstBlock,
    otherBlocks: otherBlocks.filter((catalogBlock) => catalogBlock !== lastTracksCatalogBlock),
    lastTracksCatalogBlock
  }
}

const getLastTracksCatalogBlock = (blocks: CatalogBlock[]): TracksCatalogBlock | null => {
  const [firstBlock, ...otherBlocks] = blocks

  const allBlocks = [...(firstBlock != null ? [firstBlock] : []), ...otherBlocks]
  const tracksBlocks = allBlocks.filter(isTracksCatalogBlock)
  const lastTracksCatalogBlock = tracksBlocks.length > 0 ? tracksBlocks[tracksBlocks.length - 1] : null

  if (lastTracksCatalogBlock === firstBlock) {
    return null
  }

  return lastTracksCatalogBlock
}

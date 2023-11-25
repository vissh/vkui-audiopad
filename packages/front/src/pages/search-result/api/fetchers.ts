import { vkClient } from '@vk-audiopad/common'
import { getCatalogBlocks } from '@/shared/lib/catalog-block'
import { type CatalogBlock } from '@/shared/types'
import { type FetchSearchArgs } from '../model/types'

export const fetchSearchTracks = async ({ ownerId, value }: FetchSearchArgs): Promise<CatalogBlock[]> => {
  const jsonData = await vkClient.request('https://vk.com/al_audio.php?act=section', {
    act: 'section',
    al: '1',
    claim: '0',
    is_layer: '0',
    owner_id: ownerId,
    q: value,
    section: 'search'
  })

  return getCatalogBlocks(jsonData)
}

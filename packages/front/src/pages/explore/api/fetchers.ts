import { cast, vkClient, type commonTypes } from '@vk-audiopad/common'
import { getCatalogBlocks } from '@/shared/lib/catalog-block'
import { type FetchExploreResult, type FetchMoreExploreArgs } from '../model/types'

export const fetchExplore = async (ownerId: string): Promise<FetchExploreResult> => {
  const resp = await vkClient.request('https://vk.com/al_audio.php?act=section', {
    act: 'section',
    al: '1',
    claim: '0',
    is_layer: '0',
    owner_id: ownerId,
    section: 'explore'
  })

  return prepareResult(resp)
}

export const fetchMoreExplore = async ({ sectionId, nextFrom }: FetchMoreExploreArgs): Promise<FetchExploreResult> => {
  const resp = await vkClient.request('https://vk.com/al_audio.php?act=load_catalog_section', {
    al: '1',
    section_id: sectionId,
    start_from: nextFrom
  })

  return prepareResult(resp)
}

const prepareResult = (resp: commonTypes.VKApiResponse): FetchExploreResult => {
  const sectionInfo = cast.castToJSONObject(vkClient.parseResponsePayload(resp, [1, 1]))

  return {
    nextFrom: cast.safeCastToString(sectionInfo.nextFrom),
    sectionId: cast.safeCastToString(sectionInfo.sectionId),
    blocks: getCatalogBlocks(resp)
  }
}

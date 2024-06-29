import { cast, vkClient, type commonTypes } from '@vk-audiopad/common'
import { getCatalogBlocks } from '@/shared/lib/catalog-block'
import { type FetchMoreArgs, type FetchResult } from '../model/types'

export const fetchGeneral = async (ownerId: string): Promise<FetchResult> => {
  const resp = await vkClient.request('https://vk.com/al_audio.php?act=section', {
    act: 'section',
    al: '1',
    claim: '0',
    is_layer: '0',
    owner_id: ownerId,
    section: 'general'
  })

  return prepareResult(resp)
}

export const fetchMore = async ({ sectionId, nextFrom }: FetchMoreArgs): Promise<FetchResult> => {
  const resp = await vkClient.request('https://vk.com/al_audio.php?act=load_catalog_section', {
    al: '1',
    section_id: sectionId,
    start_from: nextFrom
  })

  return prepareResult(resp)
}

const prepareResult = (resp: commonTypes.VKApiResponse): FetchResult => {
  const sectionInfo = cast.castToJSONObject(vkClient.parseResponsePayload(resp, [1, 1]))

  return {
    nextFrom: cast.safeCastToString(sectionInfo.nextFrom),
    sectionId: cast.safeCastToString(sectionInfo.sectionId),
    blocks: getCatalogBlocks(resp)
  }
}

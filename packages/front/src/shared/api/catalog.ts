import { vkApiClient } from '@vk-audiopad/common'
import { parseTokenCatalog, type TokenCatalogPage } from '../lib/token-catalog'

export const fetchCatalogSection = async (sectionId: string, nextFrom = '', signal?: AbortSignal): Promise<TokenCatalogPage> => {
  const page = parseTokenCatalog(await vkApiClient.getCatalogSection(sectionId, nextFrom, signal))
  if (page.sectionId !== sectionId) throw new vkApiClient.VKApiError('format')
  return page
}

export const fetchHomeHighlights = async (userId: string, signal?: AbortSignal): Promise<TokenCatalogPage> => {
  const page = parseTokenCatalog(await vkApiClient.getAudioCatalog(userId, signal))
  signal?.throwIfAborted()
  return page.blocks.length > 0 ? page : await fetchCatalogSection(page.sectionId, '', signal)
}

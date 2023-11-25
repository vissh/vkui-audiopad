import { cast, vkClient } from '@vk-audiopad/common'
import { getCatalogBlocks } from '@/shared/lib/catalog-block'
import { findSectionId } from '@/shared/lib/parse-html-block'
import { type FetchArtistResult } from '../model/types'

export const fetchArtistData = async (artistId: string): Promise<FetchArtistResult> => {
  const respArtist = await fetch(`https://vk.com/artist/${artistId}`)
  const html = await respArtist.text()

  const sectionId = findSectionId(html)

  if (sectionId == null) {
    throw new Error('Artist sectionId not found')
  }

  const resp = await vkClient.request('https://vk.com/al_audio.php?act=load_catalog_section', {
    al: '1',
    section_id: sectionId
  })

  return {
    backgroundImage: getBackgroundImage(cast.safeCastToString(vkClient.parseResponsePayload(resp, [1, 0, 0]))),
    blocks: getCatalogBlocks(resp)
  }
}

const getBackgroundImage = (html: string): string => {
  const htmlElement = document.createElement('html')
  htmlElement.innerHTML = html
  const coverElements = htmlElement.getElementsByClassName('MusicAuthor_block__cover')

  if (coverElements.length === 0) {
    return ''
  }

  return (coverElements[0] as HTMLDivElement).style.backgroundImage
}

import { CatalogBlockDataType, type ParsedAlbumInfo, type ParsedCatalogBlock } from '../types'
import { parseFromString } from './utils'

const trackDataTypes = new Set(['music_audios', 'radiostations'])
const albumsDataTypes = new Set(['music_playlists'])
const catalogDataTypes = new Set([...trackDataTypes, ...albumsDataTypes])

interface BlockDataTypeElement {
  blockId: string
  dataType: CatalogBlockDataType
  blockElement: Element
}

export const parseCatalogBlocks = (blockIds: string[], html: string): ParsedCatalogBlock[] => {
  const htmlElement = parseFromString(html)

  return blockIds
    .reduce(toBlockDataTypeElement(htmlElement), [])
    .map(({ blockId, dataType, blockElement }) => {
      const parentElement = findParent(blockElement)
      return {
        blockId,
        title: (parentElement != null) ? findTitle(parentElement) : '',
        dataType,
        showAllLink: (parentElement != null) ? findShowAllLink(parentElement) : '',
        parsedAlbums: dataType === CatalogBlockDataType.TRACKS ? [] : findInfoAboutAlbums(blockElement)
      }
    })
}

export const findSectionId = (html: string): string | null => {
  let sectionId = html.match(/"sectionId":\s?"(?<sectionId>[\w-]+)"/)?.groups?.sectionId
  if (sectionId == null) {
    sectionId = html.match(/\\"sectionId\\":\s?\\"(?<sectionId>[\w-]+)\\"/)?.groups?.sectionId
  }
  return sectionId != null && sectionId.length > 0 ? sectionId : null
}

const toBlockDataTypeElement = (htmlElement: Document) => {
  return (result: BlockDataTypeElement[], blockId: string): BlockDataTypeElement[] => {
    const blockElement = htmlElement.querySelector(`[data-id=${blockId}]`)

    if (blockElement == null) {
      return result
    }

    const dataType = blockElement.getAttribute('data-type')
    if ((dataType == null) || dataType.length === 0 || !catalogDataTypes.has(dataType)) {
      return result
    }

    result.push({
      blockId,
      dataType: trackDataTypes.has(dataType) ? CatalogBlockDataType.TRACKS : CatalogBlockDataType.ALBUMS,
      blockElement
    })

    return result
  }
}

const findTitle = (element: Element): string => {
  const titleElements = element.getElementsByClassName('CatalogBlock__title')
  return titleElements.length > 0 ? titleElements[0].textContent ?? '' : ''
}

const findShowAllLink = (element: Element): string => {
  const elements = element.getElementsByClassName('audio_page_block__show_all_link')
  return elements.length > 0 ? (elements[0].getAttribute('href') ?? '') : ''
}

const findParent = (blockElement: Element): Element | null => {
  const parentElement = blockElement.parentElement
  if (parentElement == null) {
    return null
  }

  if (parentElement.className.includes('CatalogBlock--divided')) {
    return parentElement
  }

  const parentParentElement = parentElement.parentElement
  if (parentParentElement == null) {
    return null
  }

  const index = Array.from(parentParentElement.children).indexOf(parentElement)
  if (index === -1) {
    return null
  }

  return Array.from(parentParentElement.children)[index - 1]
}

const findInfoAboutAlbums = (blockElement: Element): ParsedAlbumInfo[] => {
  return Array.from(blockElement.querySelectorAll('[data-id]'))
    .reduce((result: ParsedAlbumInfo[], albumElement: Element): ParsedAlbumInfo[] => {
      const albumId = albumElement.getAttribute('data-id')

      if (albumId == null || albumId.length === 0) {
        return result
      }

      result.push({
        id: albumId,
        subtitle: getTextFromHtmlElements(albumElement.getElementsByClassName('audio_pl__year_subtitle'))
      })

      return result
    }, [])
}

const getTextFromHtmlElements = (elements: HTMLCollectionOf<Element>): string => {
  if (elements.length === 0) {
    return ''
  }

  const element = elements[0]
  if (element.childNodes.length === 0) {
    return (element.textContent ?? '').trim()
  }

  return Array
    .from(element.childNodes)
    .map(x => x.textContent)
    .filter(x => x != null)
    .join(' ')
    .trim()
}

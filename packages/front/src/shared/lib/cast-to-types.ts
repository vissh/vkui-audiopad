import { cast, converter, type commonTypes } from '@vk-audiopad/common'
import { type Album } from '../types'

export const toTitlePlaylist = (playlist: commonTypes.JSONObject): commonTypes.Playlist => {
  const isRadio = cast.safeCastToString(playlist.type) === 'radio'
  const nextOffset = cast.safeCastToString(playlist.nextOffset)

  return {
    id: cast.safeCastToString(playlist.id),
    ownerId: cast.safeCastToString(playlist.ownerId),
    accessHash: cast.safeCastToString(playlist.accessHash),
    blockId: cast.safeCastToString(playlist.blockId),
    nextOffset,
    hasMore: cast.safeCastToBoolean(playlist.hasMore) && nextOffset.length > 0,
    title: isRadio ? 'Радиостанции' : getText(cast.safeCastToString(playlist.title)),
    tracks: converter.toTracksItems(playlist),
    isRadio,
    followHash: cast.safeCastToString(playlist.followHash),
    isFollowed: cast.safeCastToBoolean(playlist.isFollowed)
  }
}

export const toAlbum = (raw: commonTypes.JSONValue): Album => {
  const playlist = cast.castToJSONObject(raw)

  const coverUrl = cast.safeCastToString(playlist.coverUrl)
  const htmlGridCovers = cast.safeCastToString(playlist.gridCovers)

  const gridCoverUrls: string[] = []
  if (coverUrl.length === 0 && htmlGridCovers.length > 0) {
    const htmlElement = document.createElement('html')
    htmlElement.innerHTML = htmlGridCovers
    htmlElement.querySelectorAll('[style^="background-image:url"]').forEach(el => {
      const url = (el as HTMLInputElement).style.backgroundImage.slice(4, -1).replace(/"/g, '')
      if (url.length > 0) {
        gridCoverUrls.push(url)
      }
    })
  }

  if (gridCoverUrls.length === 0 && coverUrl.length > 0) {
    gridCoverUrls.push(coverUrl)
  }

  return {
    ...toTitlePlaylist(playlist),
    coverUrl: coverUrl.length > 0 ? coverUrl : gridCoverUrls.length > 0 ? gridCoverUrls[0] : '',
    gridCoverUrls,
    authorLine: getText(cast.safeCastToString(playlist.authorLine)),
    authorName: getText(cast.safeCastToString(playlist.authorName)),
    infoLine: cast.safeCastToString(playlist.infoLine)
  }
}

const _parser = new DOMParser()

export const getText = (str: string) => {
  if (str.startsWith('<')) {
    const htmlElement = document.createElement('html')
    htmlElement.innerHTML = str
    str = htmlElement.innerText
  }
  const doc = _parser.parseFromString(str, 'text/html')
  return doc.documentElement.textContent ?? ''
}

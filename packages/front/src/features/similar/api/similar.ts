import { cast, vkClient, type commonTypes } from '@vk-audiopad/common'
import { toTitlePlaylist } from '@/shared/lib/cast-to-types'
import { findSectionId } from '@/shared/lib/parse-html-block'

export const fetchSimilarData = async (
  userId: string,
  track: commonTypes.TrackItem
): Promise<commonTypes.Playlist | null> => {
  const queryParams = new URLSearchParams({
    __query: 'audio',
    _ref: `audios${userId}`,
    _rndVer: Math.round(Math.random() * 100000).toString(),
    al: '-1',
    al_id: userId,
    audio_id: track.id,
    section: 'recoms_audio'
  })

  const resp = await fetch('https://vk.com/al_audio.php?' + queryParams.toString())

  const html = await resp.text()

  const sectionId = findSectionId(html)

  if (sectionId == null) {
    return null
  }

  const respSection = await vkClient.request('https://vk.com/al_audio.php?act=load_catalog_section', {
    al: '1',
    section_id: sectionId
  })

  const playlist = cast.castToJSONObject(vkClient.parseResponsePayload(respSection, [1, 1])).playlist

  if (playlist == null) {
    return null
  }

  return toTitlePlaylist(cast.castToJSONObject(playlist))
}

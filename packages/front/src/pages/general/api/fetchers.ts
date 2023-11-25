import { cast, commonTypes, vkClient } from '@vk-audiopad/common'
import { toAlbum, toTitlePlaylist } from '@/shared/lib/cast-to-types'
import { type Album } from '@/shared/types'
import { type FetchGeneralResult } from '../model/types'

const vkMusicId = -147845620
const CONTEXT_GENERAL_MY_AUDIOS = 'general:my_audios_block'

export const fetchGeneral = async (ownerId: string): Promise<FetchGeneralResult> => {
  const resp = await vkClient.request('https://vk.com/al_audio.php?act=section', {
    act: 'section',
    al: '1',
    claim: '0',
    is_layer: '0',
    owner_id: ownerId,
    section: 'general'
  })

  const payload = cast.castToJSONObject(vkClient.parseResponsePayload(resp, [1, 1]))
  const playlists = cast.safeCastToArray(payload.playlists).map((playlist) => cast.castToJSONObject(playlist))

  let myPlaylist: commonTypes.Playlist | null = null
  const generalAlbums: Album[] = []
  const vkMusicAlbums: Album[] = []

  playlists.forEach(playlist => {
    if (playlist.list != null && cast.safeCastToArray(playlist.list).length > 0) {
      const tracks = cast.safeCastToArray(playlist.list).map((track) => cast.safeCastToArray(track))
      if (tracks[0][commonTypes.AudioTupleIndex.CONTEXT] === CONTEXT_GENERAL_MY_AUDIOS) {
        myPlaylist = toTitlePlaylist(playlist)
      }
    } else if (playlist.is_generated_playlist === true) {
      generalAlbums.push(toAlbum(playlist))
    } else if (playlist.ownerId === vkMusicId) {
      vkMusicAlbums.push(toAlbum(playlist))
    }
  })

  return {
    playlist: myPlaylist,
    baseOnYourTastes: generalAlbums,
    vkMusic: vkMusicAlbums
  }
}

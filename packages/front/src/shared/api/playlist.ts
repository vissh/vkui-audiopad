import { cast, vkClient, type commonTypes } from '@vk-audiopad/common'
import { toTitlePlaylist } from '../lib/cast-to-types'

export interface FetchPlaylistArgs {
  fromId: string
  playlist: commonTypes.Playlist
}

export interface FetchPlaylistResult {
  playlist: commonTypes.Playlist
}

export const fetchPlaylist = async (fetchArgs: FetchPlaylistArgs): Promise<FetchPlaylistResult> => {
  if (fetchArgs.playlist.blockId === fetchArgs.playlist.id || fetchArgs.playlist.isRadio) {
    return await fetchPlaylistByBlockId(fetchArgs)
  }

  return await fetchPlaylistById(fetchArgs)
}

export const fetchMorePlaylistTracks = async (playlist: commonTypes.Playlist): Promise<FetchPlaylistResult> => {
  const resp = await vkClient.request('https://vk.com/al_audio.php?act=load_block_playlist',
    {
      al: '1',
      block_id: playlist.blockId,
      start_from: playlist.nextOffset
    }
  )

  return vkApiResponseToPlaylist(resp)
}

const fetchPlaylistByBlockId = async (fetchArgs: FetchPlaylistArgs): Promise<FetchPlaylistResult> => {
  const resp = await vkClient.request('https://vk.com/al_audio.php?act=load_block_playlist', {
    al: '1',
    block_id: fetchArgs.playlist.blockId,
    start_from: '0'
  })

  return vkApiResponseToPlaylist(resp)
}

const fetchPlaylistById = async (fetchArgs: FetchPlaylistArgs): Promise<FetchPlaylistResult> => {
  const resp = await vkClient.request('https://vk.com/al_audio.php?act=load_section', {
    access_hash: fetchArgs.playlist.accessHash,
    al: '1',
    claim: '0',
    from_id: fetchArgs.fromId,
    is_loading_all: '1',
    is_preload: '0',
    offset: '0',
    owner_id: fetchArgs.playlist.ownerId,
    playlist_id: fetchArgs.playlist.id,
    type: 'playlist'
  })

  return vkApiResponseToPlaylist(resp)
}

const vkApiResponseToPlaylist = (resp: commonTypes.VKApiResponse): FetchPlaylistResult => {
  const rawPlaylist = cast.castToJSONObject(vkClient.parseResponsePayload(resp, [1, 0]))

  return {
    playlist: toTitlePlaylist(rawPlaylist)
  }
}

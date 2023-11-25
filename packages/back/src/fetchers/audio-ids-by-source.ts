import { cast, vkClient, type commonTypes } from '@vk-audiopad/common'

export const fetchAudiosIdsBySource = async (playlist: commonTypes.Playlist): Promise<commonTypes.AudioTuple[]> => {
  const params: Record<string, string> = (
    (playlist.blockId.length > 0)
      ? {
          al: '1',
          block_id: playlist.blockId,
          context: '',
          playlist_id: playlist.ownerId + '_' + playlist.id
        }
      : {
          al: '1',
          entity_id: playlist.ownerId + '_' + playlist.id + ((playlist.accessHash.length > 0) ? '_' + playlist.accessHash : ''),
          source: 'playlist'
        }
  )

  const resp = await vkClient.request('https://vk.com/al_audio.php?act=get_audio_ids_by_source', params)
  vkClient.parseResponsePayload(resp, [1, 0])

  const tracks = cast.castToArray(vkClient.parseResponsePayload(resp, [1, 0]))
  return tracks.map(castToAudioTuple)
}

const castToAudioTuple = (raw: commonTypes.JSONValue): commonTypes.AudioTuple => {
  const trackInfo = cast.castToJSONObject(raw)
  if (trackInfo.audio_raw_id == null || trackInfo.access_key == null) {
    throw new Error('castToAudioTuple: Expected keys not found')
  }

  if (typeof trackInfo.audio_raw_id !== 'string' || typeof trackInfo.access_key !== 'string') {
    throw new Error(`castToAudioTuple: Unexpected value types ${JSON.stringify(trackInfo)}`)
  }

  return [trackInfo.audio_raw_id, trackInfo.access_key]
}

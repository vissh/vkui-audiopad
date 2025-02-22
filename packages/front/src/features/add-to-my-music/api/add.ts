import { cast, commonTypes, converter, vkApiClient, vkClient } from '@vk-audiopad/common'

export const vkApiAdd = async (track: commonTypes.TrackItem): Promise<commonTypes.TrackItem> => {
  if (track.fromAct) {
    return await actMode(track)
  }
  return await apiMode(track)
}

const actMode = async (track: commonTypes.TrackItem): Promise<commonTypes.TrackItem> => {
  const [ownerId, audioId] = track.id.split('_')
  const resp = await vkClient.request('https://vk.com/al_audio.php?act=add', {
    al: '1',
    audio_id: audioId,
    audio_owner_id: ownerId,
    from: 'my',
    group_id: '0',
    hash: track.addHash,
    track_code: track.trackCode
  })

  const trackInfo = cast.castToArray(vkClient.parseResponsePayload(resp, [1, 0]))
  return converter.toTrackItem(trackInfo)
}

const apiMode = async (track: commonTypes.TrackItem): Promise<commonTypes.TrackItem> => {
  const [ownerId, audioId] = track.id.split('_')
  const resp = await vkApiClient.request(
    `https://api.vk.com/method/audio.add?v=${vkApiClient.QUERY_API_VERSION}&client_id=${vkApiClient.VK_APP_ID}`,
    'POST',
    {
      audio_id: audioId,
      owner_id: ownerId,
      access_key: track.accessKey,
      track_code: track.trackCode
    }
  )
  if (resp.error != null) {
    throw Error('Во время добавления трека возникла ошибка.')
  }

  // $.response.items[0]
  const respTrack = cast.castToJSONObject(cast.castToArray(cast.castToJSONObject(resp.response).items)[0])

  return {
    id: `${cast.castToNumber(respTrack.new_owner_id)}_${cast.castToNumber(respTrack.new_audio_id)}`,
    fromAct: false,
    accessKey: '',
    url: '',
    image: '',
    artist: '',
    mainArtists: [],
    featArtists: [],
    title: '',
    duration: 0,
    context: '',
    flags: commonTypes.TrackFlagBit.CAN_ADD,
    trackCode: '',
    addHash: '',
    editHash: '',
    actionHash: '',
    deleteHash: '',
    replaceHash: '',
    urlHash: '',
    restoreHash: ''
  }
}

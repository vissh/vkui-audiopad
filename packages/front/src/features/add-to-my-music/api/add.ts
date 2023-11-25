import { cast, converter, vkClient, type commonTypes } from '@vk-audiopad/common'

export const vkApiAdd = async (track: commonTypes.TrackItem): Promise<commonTypes.TrackItem> => {
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

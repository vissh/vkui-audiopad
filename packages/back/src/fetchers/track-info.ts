import { cast, commonTypes, converter, vkClient } from '@vk-audiopad/common'
import { unmaskUrl } from './unmask'

export const fetchTrackInfo = async (ownerId: string, trackId: string, accessKey: string): Promise<commonTypes.TrackItem | null> => {
  const resp = await vkClient.request('https://vk.com/al_audio.php?act=reload_audios', {
    al: '1',
    audio_ids: trackId + '_' + accessKey
  })

  const trackInfo = cast.castToArray(vkClient.parseResponsePayload(resp, [1, 0, 0]))
  const url = cast.castToString(trackInfo[commonTypes.AudioTupleIndex.URL])

  const track = converter.toTrackItem(trackInfo)
  track.url = unmaskUrl(url, ownerId)

  return track
}

import { type commonTypes, vkClient } from '@vk-audiopad/common'

export const fetchQueueParams = async (track: commonTypes.TrackItem): Promise<void> => {
  const [audioId, ownerId] = track.id.split('_')
  await vkClient.request('https://vk.com/al_audio.php?act=queue_params', {
    act: 'queue_params',
    al: '1',
    audio_id: audioId,
    hash: track.urlHash,
    owner_id: ownerId
  })
}

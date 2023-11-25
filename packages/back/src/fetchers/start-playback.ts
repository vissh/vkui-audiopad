import { vkClient, type commonTypes } from '@vk-audiopad/common'

export const fetchStartPlayback = async (track: commonTypes.TrackItem, deviceId: string): Promise<void> => {
  const [ownerId, audioId] = track.id.split('_')
  await vkClient.request('https://vk.com/al_audio.php?act=start_playback', {
    act: 'start_playback',
    al: '1',
    audio_id: audioId,
    hash: track.actionHash,
    owner_id: ownerId,
    uuid: deviceId
  })
}

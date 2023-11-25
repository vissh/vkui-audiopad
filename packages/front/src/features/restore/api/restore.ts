import { vkClient, type commonTypes } from '@vk-audiopad/common'

export const vkApiRestore = async (track: commonTypes.TrackItem): Promise<void> => {
  const [ownerId, audioId] = track.id.split('_')

  await vkClient.request('https://vk.com/al_audio.php?act=restore_audio', {
    act: 'restore_audio',
    al: '1',
    aid: audioId,
    oid: ownerId,
    hash: track.restoreHash,
    track_code: track.trackCode
  })
}

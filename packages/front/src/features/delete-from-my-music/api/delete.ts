import { vkClient, type commonTypes } from '@vk-audiopad/common'

export const vkApiDelete = async (track: commonTypes.TrackItem) => {
  await deleteTrack(track, false)
}

export const vkApiDeleteWithRestore = async (track: commonTypes.TrackItem) => {
  await deleteTrack(track, true)
}

const deleteTrack = async (track: commonTypes.TrackItem, restore: boolean): Promise<void> => {
  const [ownerId, audioId] = track.id.split('_')

  await vkClient.request('https://vk.com/al_audio.php?act=delete_audio', {
    act: 'delete_audio',
    al: '1',
    aid: audioId,
    oid: ownerId,
    restore: restore ? '1' : '0',
    hash: track.deleteHash,
    track_code: track.trackCode
  })
}

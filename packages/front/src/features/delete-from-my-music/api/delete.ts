import { vkApiClient, vkClient, type commonTypes } from '@vk-audiopad/common'

export const vkApiDelete = async (track: commonTypes.TrackItem) => {
  await deleteTrack(track, false)
}

export const vkApiDeleteWithRestore = async (track: commonTypes.TrackItem) => {
  await deleteTrack(track, true)
}

const deleteTrack = async (track: commonTypes.TrackItem, restore: boolean): Promise<void> => {
  if (track.fromAct) {
    await actDelete(track, restore)
    return
  }
  await apiDelete(track)
}

const actDelete = async (track: commonTypes.TrackItem, restore: boolean): Promise<void> => {
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

const apiDelete = async (track: commonTypes.TrackItem): Promise<void> => {
  const [ownerId, audioId] = track.id.split('_')

  await vkApiClient.request(
    `https://api.vk.com/method/audio.delete?v=${vkApiClient.QUERY_API_VERSION}&client_id=${vkApiClient.API_VERSION}`,
    'POST',
    {
      audio_id: audioId,
      owner_id: ownerId
    })
}

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

  const result = await vkClient.request('https://vk.ru/al_audio.php?act=delete_audio', {
    act: 'delete_audio',
    al: '1',
    aid: audioId,
    oid: ownerId,
    restore: restore ? '1' : '0',
    hash: track.deleteHash,
    track_code: track.trackCode
  }, undefined, { requireOk: true, retryAfterReconnect: false })
  vkClient.assertMutationResponse(result)
}

const apiDelete = async (track: commonTypes.TrackItem): Promise<void> => {
  const [ownerId, audioId] = track.id.split('_')

  const result = await vkApiClient.request(
    `https://api.vk.ru/method/audio.delete?v=${vkApiClient.QUERY_API_VERSION}&client_id=${vkApiClient.VK_APP_ID}`,
    'POST',
    {
      audio_id: audioId,
      owner_id: ownerId,
      access_key: track.accessKey
    })
  const response = result.response
  const removedIds = typeof response === 'object' && response != null && !Array.isArray(response) ? response.audio_ids : null
  if (result.error != null || (response !== 1 && (!Array.isArray(removedIds) || !removedIds.includes(track.id)))) throw new Error('VK audio deletion failed')
}

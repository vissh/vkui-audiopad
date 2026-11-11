import { vkApiClient, vkClient, type commonTypes } from '@vk-audiopad/common'

export const vkApiRestore = async (track: commonTypes.TrackItem): Promise<void> => {
  const [ownerId, audioId] = track.id.split('_')

  if (!track.fromAct) {
    const result = await vkApiClient.request(
      `https://api.vk.ru/method/audio.restore?v=${vkApiClient.QUERY_API_VERSION}&client_id=${vkApiClient.VK_APP_ID}`,
      'POST',
      { audio_id: audioId, owner_id: ownerId }
    )
    const response = result.response
    if (result.error != null || typeof response !== 'object' || response == null || Array.isArray(response) || `${response.owner_id}_${response.id}` !== track.id) throw new Error('VK audio restoration failed')
    return
  }

  const result = await vkClient.request('https://vk.ru/al_audio.php?act=restore_audio', {
    act: 'restore_audio',
    al: '1',
    aid: audioId,
    oid: ownerId,
    hash: track.restoreHash,
    track_code: track.trackCode
  }, undefined, { retryAfterReconnect: false })
  vkClient.assertMutationResponse(result)
}

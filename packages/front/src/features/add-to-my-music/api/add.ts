import { cast, converter, vkApiClient, vkClient, type commonTypes } from '@vk-audiopad/common'

export const vkApiAdd = async (track: commonTypes.TrackItem): Promise<commonTypes.TrackItem> => {
  if (track.fromAct) return await actMode(track)
  return await apiMode(track)
}

const actMode = async (track: commonTypes.TrackItem): Promise<commonTypes.TrackItem> => {
  const [ownerId, audioId] = track.id.split('_')
  const resp = await vkClient.request('https://vk.ru/al_audio.php?act=add', {
    al: '1',
    audio_id: audioId,
    audio_owner_id: ownerId,
    from: 'my',
    group_id: '0',
    hash: track.addHash,
    track_code: track.trackCode
  }, undefined, { requireOk: true, retryAfterReconnect: false })
  vkClient.assertMutationResponse(resp)
  try {
    const added = converter.toTrackItem(cast.castToArray(vkClient.parseResponsePayload(resp, [1, 0])))
    if (!/^[1-9]\d*_[1-9]\d*$/.test(added.id)) throw new Error('Invalid library identity')
    return added
  } catch {
    throw new Error('VK audio addition failed')
  }
}

const apiMode = async (track: commonTypes.TrackItem): Promise<commonTypes.TrackItem> => {
  const [ownerId, audioId] = track.id.split('_')
  const result = await vkApiClient.request(
    `https://api.vk.ru/method/audio.add?v=${vkApiClient.QUERY_API_VERSION}&client_id=${vkApiClient.VK_APP_ID}`,
    'POST',
    { audio_id: audioId, owner_id: ownerId, access_key: track.accessKey, track_code: track.trackCode }
  )
  const response = result.response
  if (typeof response !== 'object' || response == null || Array.isArray(response) || !Array.isArray(response.items) || response.items.length !== 1) throw new Error('VK audio addition failed')
  if (('errors_count' in response && response.errors_count !== 0) || ('items_count' in response && response.items_count !== 1) || ('errors' in response && (!Array.isArray(response.errors) || response.errors.length !== 0))) throw new Error('VK audio addition failed')
  const added = response.items[0]
  if (typeof added !== 'object' || added == null || Array.isArray(added) || typeof added.new_owner_id !== 'number' || !Number.isSafeInteger(added.new_owner_id) || added.new_owner_id === 0 || typeof added.new_audio_id !== 'number' || !Number.isSafeInteger(added.new_audio_id) || added.new_audio_id <= 0) throw new Error('VK audio addition failed')
  return {
    ...track,
    id: `${added.new_owner_id}_${added.new_audio_id}`,
    fromAct: false,
    accessKey: '',
    url: '',
    context: '',
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

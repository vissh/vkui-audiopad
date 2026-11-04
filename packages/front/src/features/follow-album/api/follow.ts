import { vkClient, type commonTypes } from '@vk-audiopad/common'

export const vkApiFollow = async (playlist: commonTypes.Playlist): Promise<boolean> => {
  const resp = await vkClient.request('https://vk.ru/al_audio.php?act=follow_playlist', {
    act: 'follow_playlist',
    al: '1',
    block_id: playlist.blockId,
    hash: playlist.followHash,
    playlist_id: playlist.id,
    playlist_owner_id: playlist.ownerId,
    showcase: '0'
  }, undefined, { requireOk: true, retryAfterReconnect: false })
  vkClient.assertMutationResponse(resp)
  const payload = vkClient.parseResponsePayload(resp, [1, 0])
  if (typeof payload !== 'object' || payload == null || Array.isArray(payload)) throw new Error('VK playlist update failed')
  const followed = payload.is_followed
  if (typeof followed === 'boolean') return followed
  if (followed === 0 || followed === 1) return followed === 1
  throw new Error('VK playlist update failed')
}

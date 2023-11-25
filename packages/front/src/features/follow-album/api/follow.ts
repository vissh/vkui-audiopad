import { cast, vkClient, type commonTypes } from '@vk-audiopad/common'

export const vkApiFollow = async (playlist: commonTypes.Playlist): Promise<boolean> => {
  const resp = await vkClient.request('https://vk.com/al_audio.php?act=follow_playlist', {
    act: 'follow_playlist',
    al: '1',
    block_id: playlist.blockId,
    hash: playlist.followHash,
    playlist_id: playlist.id,
    playlist_owner_id: playlist.ownerId,
    showcase: '0'
  })

  const payload = cast.castToJSONObject(vkClient.parseResponsePayload(resp, [1, 0]))
  return cast.safeCastToBoolean(payload.is_followed)
}

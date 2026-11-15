import { type commonTypes } from '@vk-audiopad/common'
import { editQueue } from '../queue'
import { mutateQueue } from '../queue-state'

export const editCurrentPlaylist = async (playlist: commonTypes.Playlist, oldPlaylist: commonTypes.Playlist, actions: commonTypes.EditActions): Promise<boolean> => {
  return await mutateQueue(state => editQueue(state, oldPlaylist, playlist, actions))
}

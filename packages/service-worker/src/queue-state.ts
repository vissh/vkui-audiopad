import { type commonTypes } from '@vk-audiopad/common'
import { commitPlayback, getPlaybackOperation } from './playback-operation'
import { sameQueue, type QueueEdit, type QueueUpdate } from './queue'
import { applicationState } from './state'

export const mutateQueue = async (transform: (state: commonTypes.ApplicationState) => QueueUpdate | null, ownsCommand: () => boolean = () => true): Promise<void> => {
  const queue = applicationState.currentPlaylist
  const userId = applicationState.userId
  const isCurrent = (): boolean => {
    const operation = getPlaybackOperation()
    return ownsCommand() && applicationState.userId === userId && sameQueue(applicationState.currentPlaylist, queue) && (operation == null || sameQueue(operation.playlist, queue))
  }
  let edits: QueueEdit[] = []
  await commitPlayback(isCurrent, () => {
    const result = transform(applicationState)
    if (result == null) return null
    edits = result.edits
    return result.changes
  }, () => {
    const operation = getPlaybackOperation()
    if (operation == null || !sameQueue(operation.playlist, applicationState.currentPlaylist) || applicationState.currentPlaylist == null) return
    operation.audiosIds = applicationState.audiosIds.map(([id, key]) => [id, key])
    operation.playlist = { ...applicationState.currentPlaylist, tracks: [...applicationState.currentPlaylist.tracks] }
    if (operation.hydrating) operation.queueEdits.push(...edits)
  })
}

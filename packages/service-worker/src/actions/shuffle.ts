import { shuffleQueue } from '../queue'
import { commitPlayback } from '../playback-operation'
import { applicationState } from '../state'
import { mutateQueue } from '../queue-state'
import { shuffle } from '../utils'

let revision = 0

export const onShuffle = async (enabled: boolean | undefined): Promise<void> => {
  if (enabled == null) return
  const command = ++revision
  await mutateQueue(state => shuffleQueue(state, enabled, shuffle), () => command === revision)
}

export const toggleShuffle = async (): Promise<void> => {
  await commitPlayback(() => true, () => ({ shuffle: !applicationState.shuffle }))
}

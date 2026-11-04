import { shuffleQueue } from '../queue'
import { mutateQueue } from '../queue-state'
import { shuffle } from '../utils'

let revision = 0

export const onShuffle = async (enabled: boolean | undefined): Promise<void> => {
  if (enabled == null) return
  const command = ++revision
  await mutateQueue(state => shuffleQueue(state, enabled, shuffle), () => command === revision)
}

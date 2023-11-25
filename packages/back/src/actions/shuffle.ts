import { applicationState } from '../state'
import { storage } from '../storage'
import { shuffle } from '../utils'

export const onShuffle = async (shuffleValue: boolean | undefined): Promise<void> => {
  if (shuffleValue == null || applicationState.activeTrackIndex === -1) {
    return
  }

  let audiosIds = applicationState.audiosIds ?? []
  const [trackId] = audiosIds[applicationState.activeTrackIndex]

  if (shuffleValue) {
    const originalAudiosIds = audiosIds
    audiosIds = shuffle(audiosIds)

    const newActiveIndex = Math.max(0, audiosIds.findIndex(([elementTrackId]) => elementTrackId === trackId))

    await storage.set({
      activeTrackIndex: newActiveIndex,
      audiosIds,
      originalAudiosIds
    })
  } else {
    const audiosIds = applicationState.originalAudiosIds
    const newActiveIndex = Math.max(0, audiosIds.findIndex(([elementTrackId]) => elementTrackId === trackId))

    await storage.set({
      activeTrackIndex: newActiveIndex,
      audiosIds,
      originalAudiosIds: []
    })
  }
}

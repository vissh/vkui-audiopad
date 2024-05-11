import { nextTrack } from './next'

const errorCountLimit = 10

export const errorState = {
  counter: 0
}

export const onError = async (): Promise<void> => {
  if (errorState.counter >= errorCountLimit) {
    return
  }
  errorState.counter += 1
  await new Promise(resolve => setTimeout(resolve, 300))
  await nextTrack()
}

import { storage } from '../storage'

export const onPause = async (): Promise<void> => {
  await storage.played.set(false)
}

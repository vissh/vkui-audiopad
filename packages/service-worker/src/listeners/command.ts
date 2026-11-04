import { nextTrack, previousTrack } from '../actions/next'
import { repeat } from '../actions/repeat'
import { applicationState } from '../state'
import { storage } from '../storage'
import { togglePlayback } from '../actions/play-or-pause'
import { type Readiness } from '../readiness'

export const startListeningCommandEvents = (readiness: Readiness): void => {
  chrome.commands.onCommand.addListener((command: string) => { readiness.run(async () => { await commandHandler(command) }) })
}

const commandHandler = async (command: string): Promise<void> => {
  // Chrome sorts shortcuts by key, so their names carry numeric prefixes.
  const commands: Record<string, (() => Promise<void>) | undefined> = {
    '010-play-pause': async () => { await togglePlayback() },
    '020-previous': async () => { await previousTrack() },
    '030-next': async () => { await nextTrack() },
    '050-shuffle': async () => { await storage.shuffle.set(!applicationState.shuffle) },
    '060-loop': async () => { await repeat() }
  }
  await commands[command]?.()
}

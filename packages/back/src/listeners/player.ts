import { commonTypes, initialState } from '@vk-audiopad/common'
import { nextTrack } from '../actions/next'
import { playCurrentTrack } from '../actions/repeat'
import { fetchStartPlayback } from '../fetchers/start-playback'
import { audioElement } from '../player'
import { applicationState } from '../state'
import { storage } from '../storage'
import { setBadgeText } from '../utils'

let errorCounter = 0
const errorCountLimit = 10

export const startListeningPlayerEvents = (): void => {
  audioElement.addEventListener('playing', () => { void onPlaying() })
  audioElement.addEventListener('pause', () => { void onPause() })
  audioElement.addEventListener('ended', () => { void onEnded() })
  audioElement.addEventListener('error', () => { void onError() })
  audioElement.addEventListener('timeupdate', createOnTimeUpdateFn())
}

const onPlaying = async (): Promise<void> => {
  errorCounter = 0
  const storageVolume = await storage.volume.get()
  audioElement.volume = storageVolume ?? initialState.Application.volume

  const [duration, currentTime] = [audioElement.duration ?? 0, Math.floor(audioElement.currentTime)]
  await storage.set({ played: true, duration, currentTime })

  const track = applicationState.activeTrack
  const deviceId = applicationState.deviceId
  setTimeout(async () => {
    if (track != null) {
      await fetchStartPlayback(track, deviceId)
    }
  }, 100)
}

const onEnded = async (): Promise<void> => {
  await storage.played.set(false)
  const repeat = await storage.repeat.get()
  if (repeat === commonTypes.RepeatMode.REPEAT_ONE) {
    await playCurrentTrack(); return
  }
  await nextTrack()
}

const onPause = async (): Promise<void> => {
  await storage.played.set(false)
}

const onError = async (): Promise<void> => {
  if (errorCounter >= errorCountLimit) {
    return
  }
  errorCounter += 1
  await new Promise(resolve => setTimeout(resolve, 300))
  await nextTrack()
}

const createOnTimeUpdateFn = (): () => void => {
  let previousDuration = 0
  let previousTime = 0

  return () => {
    void (async () => {
      const duration = audioElement.duration ?? 0
      const currentTime = Math.floor(audioElement.currentTime)

      if (previousDuration === duration && previousTime === currentTime) {
        return
      }

      previousDuration = duration
      previousTime = currentTime

      await storage.set({ duration, currentTime })

      if (audioElement.paused) {
        return
      }

      if (window.browser != null) {
        // Firefox
        void chrome.browserAction.setBadgeText({ text: '►' })
        return
      }

      setBadgeText(applicationState.durationMode)
    })()
  }
}

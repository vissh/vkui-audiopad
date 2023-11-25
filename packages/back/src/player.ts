import { type commonTypes } from '@vk-audiopad/common'
import Hls from 'hls.js'
import { applicationState } from './state'

const hlsWorkers: Hls[] = []

export const audioElement = new Audio()
audioElement.crossOrigin = 'anonymous'
audioElement.preload = 'auto'

export const playTrack = (track: commonTypes.TrackItem): void => {
  if (!track.url.includes('index.m3u8')) {
    audioElement.src = track.url
    void audioElement.play()
    return
  }

  const hls = new Hls({
    debug: applicationState.hlsDebug || false,
    maxBufferHole: 3,
    nudgeOffset: 0.5,
    nudgeMaxRetry: 5,
    maxFragLookUpTolerance: 0.2
  })
  hlsWorkers.push(hls)
  hls.loadSource(track.url)
  hls.attachMedia(audioElement)
  hls.on(Hls.Events.MEDIA_ATTACHED, () => { void audioElement.play() })
}

export const destroyPlayer = (): void => {
  while (hlsWorkers.length > 0) {
    const oldHlsWorker = hlsWorkers.pop()
    if (oldHlsWorker == null) {
      break
    }
    oldHlsWorker.stopLoad()
    oldHlsWorker.detachMedia()
    oldHlsWorker.destroy()
  }

  audioElement.removeAttribute('src')
}

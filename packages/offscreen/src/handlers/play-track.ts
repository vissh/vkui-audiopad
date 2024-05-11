import Hls from 'hls.js'
import { audioElement } from '../audio-element'

const hlsWorkers: Hls[] = []

export const playTrack = async (url: string, volume: number): Promise<void> => {
  destroyPlayer()

  audioElement.volume = volume

  if (!url.includes('index.m3u8')) {
    audioElement.src = url
    void audioElement.play()
    return
  }

  const hls = new Hls({
    maxBufferHole: 3,
    nudgeOffset: 0.5,
    nudgeMaxRetry: 5,
    maxFragLookUpTolerance: 0.2
  })

  hlsWorkers.push(hls)
  hls.loadSource(url)
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

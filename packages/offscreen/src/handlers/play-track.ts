import Hls from 'hls.js'
import { audioElement, audioPlaybackId, audioPlaybackRequested, audioRequestRevision, invalidateAudio, replaceAudio } from '../audio-element'
import { reportPlayerError } from '../listeners/player-events'
import { clearEqualizerSource, resumeEqualizer, setEqualizerSource } from '../equalizer'

const hlsWorkers: Hls[] = []

export const playTrack = async (url: string, volume: number, playbackId: string): Promise<void> => {
  destroyPlayer()
  const audio = replaceAudio(playbackId)
  audio.volume = volume
  const play = (): void => {
    if (audioPlaybackId !== playbackId || !audioPlaybackRequested) return
    const revision = audioRequestRevision
    resumeEqualizer()
    void audio.play().catch(() => { if (revision === audioRequestRevision) reportPlayerError(playbackId) })
  }

  const isHls = url.includes('index.m3u8')
  await setEqualizerSource(audio, url, isHls, play)
  if (audioPlaybackId !== playbackId) return
  if (!isHls) {
    if (audio.src.length === 0) audio.src = url
    play()
    return
  }

  const hls = new Hls({
    maxBufferHole: 3,
    nudgeOffset: 0.5,
    nudgeMaxRetry: 5,
    maxFragLookUpTolerance: 0.2
  })

  hlsWorkers.push(hls)
  hls.on(Hls.Events.MEDIA_ATTACHED, play)
  hls.on(Hls.Events.ERROR, (_event, data) => { if (data.fatal) reportPlayerError(playbackId) })
  hls.loadSource(url)
  hls.attachMedia(audio)
}

export const destroyPlayer = (): void => {
  clearEqualizerSource()
  invalidateAudio()
  audioElement.pause()
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

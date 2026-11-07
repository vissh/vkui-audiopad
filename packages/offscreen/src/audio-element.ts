const createAudio = (): HTMLAudioElement => {
  const audio = new Audio()
  // Leave crossOrigin unset: VK Mix CDN responses may lack CORS headers (ADR 0001).
  audio.preload = 'auto'
  return audio
}

export let audioElement = createAudio()
export let audioPlaybackId: string | null = null
export let audioPlaybackRequested = false
export let audioRequestRevision = 0

export const setAudioPlaybackRequested = (played: boolean): void => {
  audioPlaybackRequested = played
  audioRequestRevision++
}

export const invalidateAudio = (): void => {
  audioPlaybackId = null
  setAudioPlaybackRequested(false)
}

const listeners = new Set<(audio: HTMLAudioElement, playbackId: string | null) => void>()

export const listenToAudio = (listen: (audio: HTMLAudioElement, playbackId: string | null) => () => void): void => {
  let cleanup = listen(audioElement, audioPlaybackId)
  listeners.add((audio, playbackId) => {
    cleanup()
    cleanup = listen(audio, playbackId)
  })
}

export const replaceAudio = (playbackId: string): HTMLAudioElement => {
  audioElement.pause()
  audioElement.removeAttribute('src')
  audioElement = createAudio()
  audioPlaybackId = playbackId
  setAudioPlaybackRequested(true)
  listeners.forEach(listen => { listen(audioElement, playbackId) })
  return audioElement
}

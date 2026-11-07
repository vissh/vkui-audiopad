import { equalizer } from '@vk-audiopad/common'
import { commonTypes } from '@vk-audiopad/common'
import { audioPlaybackId, audioPlaybackRequested, setAudioPlaybackRequested } from './audio-element'
import { sendMessage } from './send-message'

interface Source {
  audio: HTMLAudioElement
  url: string
  hls: boolean
  play: () => void
  controller?: AbortController
  blobUrl?: string
  node?: MediaElementAudioSourceNode
  metadata?: () => void
  retry?: boolean
  starting: boolean
}

let settings = equalizer.normalize(undefined)
let mixAccess = false
let source: Source | undefined
let context: AudioContext | undefined
let filters: BiquadFilterNode[] = []
let preamp: GainNode | undefined
let status: equalizer.Status | undefined

const publish = (value: equalizer.Status): void => {
  if (status === value) return
  if (status == null && value === 'off') return
  status = value
  void sendMessage({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.EQUALIZER_STATUS, playbackId: audioPlaybackId, status: value }).catch(() => {})
}

export const changeEqualizer = (value: unknown, retry = false, allowMix = false): void => {
  const wasEnabled = settings.enabled
  const gainedAccess = !mixAccess && allowMix
  mixAccess = allowMix
  settings = equalizer.normalize(value)
  updateGraph()
  if (wasEnabled && settings.enabled && status === 'unavailable' && !retry && !gainedAccess) return
  void activate()
}

const updateGraph = (immediate = false): void => {
  if (context == null || preamp == null) return
  const time = context.currentTime
  const apply = (parameter: AudioParam, value: number): void => {
    if (immediate) {
      parameter.cancelScheduledValues(time)
      parameter.value = value
    } else parameter.setTargetAtTime(value, time, 0.02)
  }
  apply(preamp.gain, equalizer.headroom(settings, context.sampleRate))
  filters.forEach((filter, index) => {
    apply(filter.gain, settings.enabled ? settings.gains[index] : 0)
  })
}

const connect = async (current: Source): Promise<void> => {
  if (context == null) {
    const created = new AudioContext()
    const gain = created.createGain()
    const bands = equalizer.frequencies.map((frequency, index) => {
      const filter = created.createBiquadFilter()
      filter.type = index === 0 ? 'lowshelf' : index === equalizer.frequencies.length - 1 ? 'highshelf' : 'peaking'
      filter.frequency.value = Math.min(frequency, created.sampleRate * 0.45)
      filter.Q.value = 1
      return filter
    })
    gain.connect(bands[0])
    bands.forEach((filter, index) => { filter.connect(bands[index + 1] ?? created.destination) })
    context = created
    preamp = gain
    filters = bands
  }
  await context.resume()
  if (source !== current || !settings.enabled) return
  if (current.node == null) {
    // Only same-origin HLS MediaSource/blob media can enter this graph safely.
    current.node = context.createMediaElementSource(current.audio)
    current.node.connect(preamp!)
  }
  updateGraph(current.starting)
  publish('active')
}

const MAX_BYTES = 32 * 1024 * 1024

const download = async (url: string, signal: AbortSignal): Promise<Blob> => {
  const response = await fetch(url, { signal, credentials: 'omit' })
  if (!response.ok || response.body == null) throw new Error('Media unavailable')
  const reader = response.body.getReader()
  const chunks: ArrayBuffer[] = []
  let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > MAX_BYTES) throw new Error('Media too large')
      chunks.push(Uint8Array.from(value).buffer)
    }
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
  return new Blob(chunks, { type: response.headers.get('content-type') ?? 'audio/mpeg' })
}

const activate = async (): Promise<void> => {
  const current = source
  if (!settings.enabled) {
    current?.controller?.abort()
    if (current != null) current.retry = false
    publish('off')
    return
  }
  if (current == null) { publish('waiting'); return }
  if (!current.hls && current.blobUrl == null && equalizer.isMixSource(current.url) && !mixAccess) {
    current.controller?.abort()
    current.retry = false
    publish('unavailable')
    return
  }
  if (current.controller != null) {
    if (current.controller.signal.aborted) current.retry = true
    return
  }
  let metadataReady = false
  let graphReady = false
  const resumeConverted = (): void => {
    if (source === current && metadataReady && graphReady) current.play()
  }
  try {
    if (!current.hls && current.blobUrl == null) {
      const controller = new AbortController()
      current.controller = controller
      publish('loading')
      const timeout = setTimeout(() => { controller.abort() }, 15000)
      let blob: Blob
      try {
        blob = await download(current.url, controller.signal)
      } finally {
        clearTimeout(timeout)
        current.controller = undefined
      }
      if (source !== current || !settings.enabled || controller.signal.aborted) return
      const position = current.audio.currentTime
      current.blobUrl = URL.createObjectURL(blob)
      if (!current.starting) {
        current.metadata = () => {
          if (source !== current) return
          current.audio.currentTime = position
          metadataReady = true
          resumeConverted()
        }
        current.audio.addEventListener('loadedmetadata', current.metadata, { once: true })
      }
      // Connect only after replacing the cross-origin source with local media.
      setAudioPlaybackRequested(audioPlaybackRequested)
      current.audio.src = current.blobUrl
    }
    await connect(current)
    graphReady = true
    resumeConverted()
  } catch {
    // A failed preparation falls back to native media without processing.
    if (source === current) {
      graphReady = true
      resumeConverted()
      if (current.retry !== true) publish(settings.enabled ? 'unavailable' : 'off')
    }
  } finally {
    if (source === current && settings.enabled && current.retry === true && current.controller == null) {
      current.retry = false
      await activate()
    }
  }
}

export const setEqualizerSource = async (audio: HTMLAudioElement, url: string, hls: boolean, play: () => void): Promise<void> => {
  clearEqualizerSource()
  const current: Source = { audio, url, hls, play, starting: true }
  source = current
  await activate()
  if (source === current) current.starting = false
}

export const isEqualizerPreparing = (): boolean => source?.starting === true

export const resumeEqualizer = (): void => {
  if (context != null) void context.resume().catch(() => { publish('unavailable') })
}

export const clearEqualizerSource = (): void => {
  const previous = source
  source = undefined
  status = undefined
  previous?.controller?.abort()
  previous?.node?.disconnect()
  if (previous?.metadata != null) previous.audio.removeEventListener('loadedmetadata', previous.metadata)
  if (previous?.blobUrl != null) URL.revokeObjectURL(previous.blobUrl)
}

import { type commonTypes } from '@vk-audiopad/common'
import { audioElement, audioPlaybackId, audioPlaybackRequested } from './audio-element'
import { getActivity } from './activity'

const documentId = crypto.randomUUID()

export const getPlayerSnapshot = (): commonTypes.PlayerSnapshot => ({
  documentId,
  ...getActivity(),
  playbackId: audioPlaybackId,
  hasSource: audioPlaybackId != null,
  requested: audioPlaybackRequested,
  paused: audioElement.paused,
  playing: !audioElement.paused && !audioElement.ended && audioElement.error == null && audioElement.readyState >= 3,
  ended: audioElement.ended,
  failed: audioElement.error != null,
  currentTime: Number.isFinite(audioElement.currentTime) ? Math.max(0, audioElement.currentTime) : 0,
  duration: Number.isFinite(audioElement.duration) ? Math.max(0, audioElement.duration) : 0
})

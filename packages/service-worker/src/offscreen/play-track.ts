import { commonTypes, equalizer } from '@vk-audiopad/common'
import { sendOffscreenMessage } from './send-message'
import { equalizerMixAccess } from './equalizer-mix-access'
import { applicationState } from '../state'

export const playTrack = async (url: string, volume: number, playbackId: string, isCurrent: () => boolean): Promise<void> => {
  await sendOffscreenMessage(async () => ({
    target: commonTypes.MessageTarget.OFFSCREEN,
    type: commonTypes.MessageType.PLAY_TRACK,
    playbackId,
    url,
    volume,
    equalizerMixAccess: await equalizerMixAccess(),
    equalizer: equalizer.normalize(applicationState.equalizer)
  }), isCurrent)
}

import { commonTypes, commonUtils, initialState, commandClient } from '@vk-audiopad/common'
import { retirePlayback } from './playback-operation'
import { applicationState } from './state'

export const retireSessionPlayback = async (signal?: AbortSignal): Promise<void> => {
  retirePlayback()
  if (applicationState.playbackId != null) {
    const offscreen = await commonUtils.offscreenDocumentSupport()
    const exists = !offscreen || (await chrome.runtime.getContexts({ contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT] })).length > 0
    if (exists) {
      const message: commonTypes.OffscreenPlayOrPauseMessage = {
        target: commonTypes.MessageTarget.OFFSCREEN,
        type: commonTypes.MessageType.PLAY_OR_PAUSE,
        played: false
      }
      if (!(await commandClient.requestCommand(message, !offscreen, signal)).ok) throw new Error('Session player could not be paused')
    }
  }
  signal?.throwIfAborted()
  Object.assign(applicationState, initialState.ApplicationActiveTrack, initialState.PlaylistSystem, initialState.CurrentTime)
}

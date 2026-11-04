import { commonUtils, type commonTypes } from '@vk-audiopad/common'
import { commitPlayback, getPlaybackIntentRevision, getRequestedPlayback } from '../playback-operation'
import { requestPlayerSnapshot } from './player-snapshot'

const path = 'offscreen.html'
let lifecycle = Promise.resolve()
let commandRevision = 0
let pendingCommands = 0
let closing = false

const exclusive = <T>(action: () => Promise<T>): Promise<T> => {
  const task = lifecycle.then(action)
  lifecycle = task.then(() => {}, () => {})
  return task
}

export const beginOffscreenCommand = (): (() => void) => {
  commandRevision++
  pendingCommands++
  return () => { pendingCommands-- }
}

export const isOffscreenClosing = (): boolean => closing

const hasDocument = async (): Promise<boolean> => {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [chrome.runtime.getURL(path)]
  })

  return contexts.length > 0
}

const ensureDocument = async (): Promise<void> => {
  if (await hasDocument()) return
  await chrome.offscreen.createDocument({
    url: path,
    reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK, chrome.offscreen.Reason.WORKERS],
    justification: 'audio-player'
  })
}

export const setupOffscreenDocument = async (isCurrent: () => boolean = () => true, action: () => Promise<void> = async () => {}): Promise<void> => {
  await exclusive(async () => {
    if (!isCurrent()) return
    await ensureDocument()
    if (isCurrent()) await action()
  })
}

export const closeOffscreenDocument = async (request: commonTypes.CloseOffscreenDocumentMessage): Promise<void> => {
  const revision = commandRevision
  const intent = getPlaybackIntentRevision()
  const canClose = (): boolean => commandRevision === revision && getPlaybackIntentRevision() === intent && pendingCommands === 0 && !getRequestedPlayback()
  if (!await commonUtils.offscreenDocumentSupport()) return
  await exclusive(async () => {
    if (!canClose()) return
    const player = await requestPlayerSnapshot(true, () => {})
    if (!canClose() || player == null || !player.idle || !player.paused || player.requested || player.documentId !== request.documentId || player.playbackId !== request.playbackId || player.activityRevision !== request.activityRevision) return
    closing = true
    try {
      await chrome.offscreen.closeDocument()
      await commitPlayback(canClose, { played: false, playbackRequested: false, playbackId: null })
    } finally {
      closing = false
    }
  })
}

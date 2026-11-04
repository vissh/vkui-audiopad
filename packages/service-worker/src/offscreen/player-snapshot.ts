import { commonTypes, commonUtils } from '@vk-audiopad/common'

const SNAPSHOT_TIMEOUT_MS = 2000

const validSnapshot = (value: unknown): value is commonTypes.PlayerSnapshot => {
  if (typeof value !== 'object' || value == null) return false
  const snapshot = value as Record<string, unknown>
  return typeof snapshot.documentId === 'string' &&
    typeof snapshot.activityRevision === 'number' && Number.isSafeInteger(snapshot.activityRevision) && snapshot.activityRevision >= 0 &&
    typeof snapshot.idle === 'boolean' && (snapshot.playbackId === null || typeof snapshot.playbackId === 'string') &&
    ['hasSource', 'requested', 'paused', 'playing', 'ended', 'failed'].every(key => typeof snapshot[key] === 'boolean') &&
    ['currentTime', 'duration'].every(key => typeof snapshot[key] === 'number' && Number.isFinite(snapshot[key]) && snapshot[key] >= 0)
}

export const requestPlayerSnapshot = async (offscreen: boolean, acceptMedia: () => void, { waitForReady = false, isCurrent = () => true }: { waitForReady?: boolean, isCurrent?: () => boolean } = {}): Promise<commonTypes.PlayerSnapshot | null> => {
  if (offscreen && !waitForReady) {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
      documentUrls: [chrome.runtime.getURL('offscreen.html')]
    })
    if (contexts.length === 0) {
      acceptMedia()
      return null
    }
  }
  return await new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID()
    let removeBridge = (): void => {}
    let retry: ReturnType<typeof setInterval> | undefined
    const cleanup = (): void => {
      clearTimeout(timer)
      clearInterval(retry)
      chrome.runtime.onMessage.removeListener(receive)
      removeBridge()
    }
    const fail = (): void => {
      cleanup()
      reject(new Error('Player snapshot unavailable'))
    }
    const receive = (message: commonTypes.Message): void => {
      if (message.target !== commonTypes.MessageTarget.SERVICE_WORKER || message.type !== commonTypes.MessageType.PLAYER_SNAPSHOT || message.requestId !== requestId) return
      if (!validSnapshot(message.snapshot)) {
        fail()
        return
      }
      cleanup()
      acceptMedia()
      resolve(message.snapshot)
    }
    const timer = setTimeout(fail, SNAPSHOT_TIMEOUT_MS)
    chrome.runtime.onMessage.addListener(receive)
    const message: commonTypes.GetPlayerSnapshotMessage = {
      target: commonTypes.MessageTarget.OFFSCREEN,
      type: commonTypes.MessageType.GET_PLAYER_SNAPSHOT,
      requestId
    }
    const send = (): void => {
      if (!isCurrent()) {
        cleanup()
        resolve(null)
        return
      }
      try {
        if (offscreen) void chrome.runtime.sendMessage(message).catch(() => { if (!waitForReady) fail() })
        else commonUtils.sendBackgroundMessage(message)
      } catch {
        fail()
      }
    }
    try {
      if (!offscreen) removeBridge = commonUtils.addBackgroundMessageListener(receive)
      if (waitForReady) retry = setInterval(send, 50)
      send()
    } catch {
      fail()
    }
  })
}

import { commonTypes, commonUtils } from '@vk-audiopad/common'
import { requestPlayerSnapshot } from './offscreen/player-snapshot'
import { commitPlayback, requestPlayback, restorePlayback } from './playback-operation'
import { applicationState, loadState } from './state'

export const initializePlayback = async (offscreen: boolean, acceptMedia: () => void): Promise<void> => {
  try {
    await chrome.storage.local.set({ playbackInitialization: 'loading' })
    await loadState()
    const player = await requestPlayerSnapshot(offscreen, acceptMedia, { waitForReady: !offscreen })
    const matches = player?.hasSource === true && player.playbackId != null && player.playbackId === applicationState.playbackId && applicationState.activeTrack != null && applicationState.currentPlaylist != null
    const usable = matches && !player.ended && !player.failed
    if (player?.hasSource === true && !usable) {
      const message: commonTypes.OffscreenPlayOrPauseMessage = {
        target: commonTypes.MessageTarget.OFFSCREEN,
        type: commonTypes.MessageType.PLAY_OR_PAUSE,
        played: false
      }
      if (offscreen) await chrome.runtime.sendMessage(message)
      else commonUtils.sendBackgroundMessage(message)
    }
    const requested = usable && player.requested
    requestPlayback(requested)
    if (usable && player.playbackId != null) restorePlayback(player.playbackId)
    await commitPlayback(() => true, {
      played: usable && player.playing,
      playbackRequested: requested,
      playbackId: usable ? player.playbackId : null,
      playbackError: player?.hasSource === true && !usable ? 'Состояние плеера изменилось. Запустите трек повторно' : applicationState.playbackError,
      ...(usable ? { currentTime: player.currentTime, duration: player.duration, playbackError: null } : {}),
      playbackInitialization: 'ready'
    })
  } catch (error) {
    requestPlayback(false)
    const failure = {
      playbackInitialization: 'failed' as const,
      playbackRequested: false,
      playbackError: 'Не удалось восстановить состояние плеера. Перезапустите расширение'
    }
    Object.assign(applicationState, failure)
    try {
      await chrome.storage.local.set(failure)
    } catch {
      console.warn('Initialization failure could not be published')
    }
    throw error
  }
}

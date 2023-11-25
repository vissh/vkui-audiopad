import { commonTypes, commonUtils } from '@vk-audiopad/common'
import { fetchListenedData } from './fetchers/listened-data'
import { audioElement } from './player'
import { applicationState } from './state'
import { type ActionType, type TListenedData } from './types'

export const shuffle = (array: commonTypes.AudioTuple[]): commonTypes.AudioTuple[] => {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

export const sendListenedData = (endStreamReason: commonTypes.EndOfStreamReason): void => {
  if ((applicationState.activeTrack != null) && !((applicationState.currentPlaylist?.isRadio) ?? false)) {
    const listenedData: TListenedData = {
      userId: applicationState.userId,
      track: applicationState.activeTrack,
      listened: Math.floor(audioElement.currentTime),
      endStreamReason
    }
    setTimeout(async () => { await fetchListenedData(listenedData) }, 10)
  }
}

export const setBadgeText = (durationMode: commonTypes.DurationMode): void => {
  const timeLeft = durationMode === commonTypes.DurationMode.TIME_LEFT
  const [duration, currentTime] = [audioElement.duration ?? 0, Math.floor(audioElement.currentTime)]

  if ((duration !== 0) && duration !== Infinity) {
    const time = timeLeft ? duration - currentTime : currentTime
    const value = commonUtils.toHHMMSS(time)
    void chrome.browserAction.setBadgeText({ text: timeLeft ? '-' + value : value })
  } else if (duration === Infinity) {
    // radio
    void chrome.browserAction.setBadgeText({ text: commonUtils.toHHMMSS(currentTime) })
  }
}

export const createAudiosIds = (tracks: commonTypes.TrackItem[]): commonTypes.AudioTuple[] => {
  return tracks.map(track => [track.id, track.accessKey])
}

export const getNewIndex = (action: ActionType, index: number, length: number): number => {
  const value = action === 'next' ? (index + 1) % length : (index === 0 ? length : index) - 1
  return value < 0 ? 0 : value
}

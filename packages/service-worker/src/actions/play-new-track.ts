import { commonTypes, vkApiClient } from '@vk-audiopad/common'
import { fetchTrackInfo } from '../fetchers/track-info'
import { playTrack } from '../offscreen/play-track'
import { playOrPause } from '../offscreen/play-or-pause'
import { beginPlayback, commitPlayback, getPlaybackOperation, isLatestPlayback, isRunningPlayback, MAX_FAILED_TRACKS, MAX_TRACK_ATTEMPTS, MAX_PLAYBACK_ATTEMPTS, requestPlayback, waitForPlayback, type PlaybackOperation } from '../playback-operation'
import { applicationState } from '../state'
import { hydrateQueue } from './hydrate-queue'
import { createAudiosIds, sendListenedData } from '../utils'

const MAX_VK_MIX_HISTORY = 30

export const stopPlayback = async (operation: PlaybackOperation, error: string): Promise<void> => {
  if (!isLatestPlayback(operation)) return
  const hadPlayer = operation.playbackId != null || applicationState.playbackId != null
  operation.failed = true
  operation.controller.abort()
  const ownsIntent = requestPlayback(false)
  const isCurrent = (): boolean => isLatestPlayback(operation) && ownsIntent()
  if (await commitPlayback(isCurrent, { played: false, playbackRequested: false, playbackId: null, playbackError: error }) && hadPlayer) {
    try {
      await playOrPause(false, isCurrent)
    } catch {
      console.warn('Player could not be reached after a playback failure')
    }
  }
}

export const playNewTrack = async (newTrackId: string | null, playlist: commonTypes.Playlist, previousOperation?: PlaybackOperation): Promise<void> => {
  const isNewPlaylist = applicationState.currentPlaylist == null || differentPlaylists(playlist, applicationState.currentPlaylist)
  const audiosIds = isNewPlaylist ? createAudiosIds(playlist.tracks) : applicationState.audiosIds
  const pending = getPlaybackOperation()
  const needsQueue = !playlist.isRadio && !playlist.isVkMix && (isNewPlaylist || (pending?.hydrating === true && !differentPlaylists(playlist, pending.playlist)))
  const operation = previousOperation ?? beginPlayback(newTrackId, playlist, audiosIds)
  if (!isRunningPlayback(operation)) return
  if (previousOperation == null) requestPlayback(true)
  if (previousOperation != null) {
    operation.controller.abort()
    operation.controller = new AbortController()
  }
  operation.playlist = { ...playlist, tracks: [...playlist.tracks] }
  operation.audiosIds = (previousOperation?.audiosIds ?? audiosIds).map(([id, key]) => [id, key])
  operation.trackId = newTrackId
  operation.loading = true
  operation.launched = false
  operation.hydrating = needsQueue
  operation.playbackId = null
  const revision = ++operation.revision
  const isCurrent = (): boolean => isRunningPlayback(operation) && operation.revision === revision && !operation.retryPending

  let dispatchFailed = false
  try {
    if (!await commitPlayback(isCurrent, { playbackRequested: true, playbackError: null })) return
    const selected = await resolveTrack(operation)
    if (!isCurrent()) return
    if (selected == null) {
      await stopPlayback(operation, playbackFailureMessage(operation))
      return
    }
    const [track] = selected
    sendListenedData(commonTypes.EndOfStreamReason.NEW)
    operation.playbackId = crypto.randomUUID()
    if (!await commitPlayback(isCurrent, () => ({
      activeTrack: track,
      activeTrackIndex: operation.audiosIds.findIndex(([id]) => id === track.id),
      currentTime: 0,
      duration: track.duration,
      currentPlaylist: operation.playlist,
      audiosIds: operation.audiosIds,
      played: false,
      playbackId: operation.playbackId,
      playbackError: null,
      ...(isNewPlaylist ? { originalAudiosIds: [] } : {})
    }))) return
    try {
      await playTrack(track.url, applicationState.volume, operation.playbackId, isCurrent)
    } catch (error) {
      dispatchFailed = true
      throw error
    }
    if (isCurrent()) {
      operation.loading = false
      operation.launched = true
    }
    if (!isCurrent() || !needsQueue) return

    await hydrateQueue(operation)
  } catch (error) {
    if (isCurrent()) {
      console.warn('Playback preparation failed', error instanceof vkApiClient.VKApiError ? error.kind : 'unavailable')
      if (dispatchFailed && operation.attempts < MAX_PLAYBACK_ATTEMPTS && await waitForPlayback(operation, 500)) {
        await playNewTrack(operation.trackId, operation.playlist, operation)
      } else if (isCurrent()) {
        await stopPlayback(operation, playbackFailureMessage(operation))
      }
    }
  } finally {
    if (operation.revision === revision) operation.loading = false
  }
}

export const playbackFailureMessage = (operation: PlaybackOperation): string => {
  const count = operation.visited.size
  return count >= MAX_FAILED_TRACKS
    ? 'Не удалось запустить 5 треков подряд. Проверьте соединение или выберите другую музыку'
    : 'Доступные треки не удалось запустить. Проверьте соединение или выберите другую музыку'
}

const resolveTrack = async (operation: PlaybackOperation): Promise<[commonTypes.TrackItem, number] | null> => {
  while (isRunningPlayback(operation) && operation.attempts < MAX_PLAYBACK_ATTEMPTS) {
    const { playlist, controller } = operation
    let index = operation.trackId == null ? 0 : operation.audiosIds.findIndex(([id]) => id === operation.trackId)
    const exhausted = operation.trackId != null && (operation.trackAttempts.get(operation.trackId) ?? 0) >= MAX_TRACK_ATTEMPTS
    if (exhausted) {
      index = nextUnvisitedIndex(operation, index)
      operation.trackId = operation.audiosIds[index]?.[0] ?? null
    }
    if (operation.trackId == null && playlist.isVkMix) {
      if (operation.visited.size >= MAX_FAILED_TRACKS) return null
      operation.attempts++
      try {
        const track = await vkApiClient.getStreamMixAudios(controller.signal)
        if (!isRunningPlayback(operation)) return null
        if (!operation.visited.has(track.id)) {
          operation.visited.add(track.id)
          operation.trackAttempts.set(track.id, 1)
          if (playlist.tracks.length >= MAX_VK_MIX_HISTORY) {
            playlist.tracks = playlist.tracks.slice(1)
            playlist.id = crypto.randomUUID()
          }
          index = playlist.tracks.push(track) - 1
          operation.audiosIds = createAudiosIds(playlist.tracks)
          operation.trackId = track.id
          if (track.url.length > 0) return [track, index]
        }
      } catch (error) {
        if (!isRunningPlayback(operation)) return null
        if (error instanceof vkApiClient.VKApiError && ['session-changed', 'unauthorized'].includes(error.kind)) throw error
        warnPreparationFailure(error)
      }
    } else {
      if (index < 0) {
        operation.audiosIds = createAudiosIds(playlist.tracks)
        index = operation.audiosIds.findIndex(([id]) => id === operation.trackId)
      }
      const candidate = operation.audiosIds[index]
      if (candidate == null) return null
      if (!operation.visited.has(candidate[0]) && operation.visited.size >= MAX_FAILED_TRACKS) return null
      operation.trackId = candidate[0]
      operation.visited.add(candidate[0])
      operation.trackAttempts.set(candidate[0], (operation.trackAttempts.get(candidate[0]) ?? 0) + 1)
      operation.attempts++
      try {
        const track = playlist.isRadio
          ? playlist.tracks.find(item => item.id === candidate[0]) ?? null
          : await fetchTrackInfo(applicationState.userId, candidate[0], candidate[1], controller.signal)
        if (!isRunningPlayback(operation)) return null
        if (track != null && track.url.length > 0) return [track, index]
      } catch (error) {
        if (!isRunningPlayback(operation)) return null
        if (error instanceof vkApiClient.VKApiError && ['session-changed', 'unauthorized'].includes(error.kind)) throw error
        warnPreparationFailure(error)
      }
    }
    if (operation.attempts >= MAX_PLAYBACK_ATTEMPTS || !await waitForPlayback(operation, 500)) return null
  }
  return null
}

const warnPreparationFailure = (error: unknown): void => {
  console.warn('Playback preparation failed', error instanceof vkApiClient.VKApiError ? error.kind : 'unavailable')
}

const nextUnvisitedIndex = (operation: PlaybackOperation, index: number): number => {
  for (let offset = 1; offset <= operation.audiosIds.length; offset++) {
    const candidate = (index + offset) % operation.audiosIds.length
    if (!operation.visited.has(operation.audiosIds[candidate][0])) return candidate
  }
  return -1
}

const differentPlaylists = (next: commonTypes.Playlist, previous: commonTypes.Playlist): boolean => {
  return next.id !== previous.id || next.ownerId !== previous.ownerId || next.blockId !== previous.blockId ||
    next.tracks.length !== previous.tracks.length || next.tracks.some((track, index) => track.id !== previous.tracks[index].id)
}

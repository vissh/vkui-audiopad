import { commonTypes, vkApiClient } from '@vk-audiopad/common'
import { fetchTrackInfo } from '../fetchers/track-info'
import { playTrack } from '../offscreen/play-track'
import { playOrPause } from '../offscreen/play-or-pause'
import { beginPlayback, commitPlayback, getPlaybackOperation, isLatestPlayback, isRunningPlayback, MAX_PLAYBACK_ATTEMPTS, requestPlayback, waitForPlayback, type PlaybackOperation } from '../playback-operation'
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
  operation.audiosIds = audiosIds.map(([id, key]) => [id, key])
  operation.trackId = newTrackId
  operation.loading = true
  operation.launched = false
  operation.hydrating = needsQueue
  operation.playbackId = null
  const revision = ++operation.revision
  const isCurrent = (): boolean => isRunningPlayback(operation) && operation.revision === revision && !operation.retryPending

  try {
    if (!await commitPlayback(isCurrent, { playbackRequested: true })) return
    const selected = await resolveTrack(operation)
    if (!isCurrent()) return
    if (selected == null) {
      await stopPlayback(operation, 'Не удалось воспроизвести треки. Выберите другой трек или повторите попытку.')
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
    await playTrack(track.url, applicationState.volume, operation.playbackId, isCurrent)
    if (isCurrent()) {
      operation.loading = false
      operation.launched = true
    }
    if (!isCurrent() || !needsQueue) return

    await hydrateQueue(operation)
  } catch (error) {
    if (isCurrent()) {
      console.warn('Playback preparation failed', error instanceof vkApiClient.VKApiError ? error.kind : 'unavailable')
      await stopPlayback(operation, 'Не удалось загрузить или запустить трек. Повторите попытку.')
    }
  } finally {
    if (operation.revision === revision) operation.loading = false
  }
}

const resolveTrack = async (operation: PlaybackOperation): Promise<[commonTypes.TrackItem, number] | null> => {
  while (isRunningPlayback(operation) && operation.attempts < MAX_PLAYBACK_ATTEMPTS) {
    const { playlist, controller } = operation
    if (playlist.isVkMix && operation.trackId == null) {
      operation.attempts++
      const track = await vkApiClient.getStreamMixAudios(controller.signal)
      if (!isRunningPlayback(operation)) return null
      const visited = operation.visited.has(track.id)
      operation.visited.add(track.id)
      if (visited || track.url.length === 0) {
        if (operation.attempts >= MAX_PLAYBACK_ATTEMPTS || !await waitForPlayback(operation, 500)) return null
        continue
      }
      if (playlist.tracks.length >= MAX_VK_MIX_HISTORY) {
        playlist.tracks = playlist.tracks.slice(1)
        playlist.id = crypto.randomUUID()
      }
      const index = playlist.tracks.push(track) - 1
      operation.audiosIds = createAudiosIds(playlist.tracks)
      operation.trackId = track.id
      return [track, index]
    }

    let index = operation.trackId == null ? 0 : operation.audiosIds.findIndex(([id]) => id === operation.trackId)
    if (index < 0) {
      operation.audiosIds = createAudiosIds(playlist.tracks)
      index = operation.audiosIds.findIndex(([id]) => id === operation.trackId)
    }
    if (index >= 0 && operation.visited.has(operation.audiosIds[index][0])) index = nextUnvisitedIndex(operation, index)
    const candidate = operation.audiosIds[index]
    if (candidate == null || operation.visited.has(candidate[0])) return null
    operation.trackId = candidate[0]
    operation.visited.add(candidate[0])
    operation.attempts++
    const track = playlist.isRadio
      ? playlist.tracks.find(item => item.id === candidate[0]) ?? null
      : await fetchTrackInfo(applicationState.userId, candidate[0], candidate[1], controller.signal)
    if (!isRunningPlayback(operation)) return null
    if (track != null && track.url.length > 0) return [track, index]
    const next = operation.audiosIds[nextUnvisitedIndex(operation, index)]
    if (next == null || operation.visited.has(next[0]) || operation.attempts >= MAX_PLAYBACK_ATTEMPTS) return null
    operation.trackId = next[0]
    if (!await waitForPlayback(operation, 500)) return null
  }
  return null
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

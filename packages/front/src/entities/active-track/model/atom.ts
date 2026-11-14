import { initialState, type commonTypes } from '@vk-audiopad/common'
import { useSyncExternalStore } from 'react'
import { storageAtom, useAtomValue } from '@/shared/lib/atom'
import { samePlaylist } from '@/shared/lib/pagination'

const playedAtom = storageAtom({
  key: 'played',
  initial: initialState.ApplicationActiveTrack.played,
  compareObjects: false
})

const playbackRequestedAtom = storageAtom<boolean | undefined>({
  key: 'playbackRequested',
  initial: undefined,
  compareObjects: false
})

const subscribeRequestedPlayback = (listener: () => void) => {
  const stopRequested = playbackRequestedAtom.subscribe(listener)
  const stopPlayed = playedAtom.subscribe(listener)
  return () => { stopRequested(); stopPlayed() }
}

export const usePlaybackRequested = (): boolean => useSyncExternalStore(subscribeRequestedPlayback, requestedPlayback)

const playbackInitializationAtom = storageAtom({
  key: 'playbackInitialization',
  initial: initialState.ApplicationActiveTrack.playbackInitialization,
  compareObjects: false
})

export const usePlaybackInitialization = () => useAtomValue(playbackInitializationAtom)

const playbackErrorAtom = storageAtom({
  key: 'playbackError',
  initial: initialState.ApplicationActiveTrack.playbackError,
  compareObjects: false
})

export const usePlaybackError = (): string | null => useAtomValue(playbackErrorAtom)

const activeTrackAtom = storageAtom({
  key: 'activeTrack',
  initial: initialState.ApplicationActiveTrack.activeTrack,
  compareObjects: (prevTrack, newTrack) => prevTrack != null && newTrack != null && prevTrack.id === newTrack.id
})

const currentTimeAtom = storageAtom({
  key: 'currentTime',
  initial: initialState.CurrentTime.currentTime,
  compareObjects: false
})

const durationAtom = storageAtom({
  key: 'duration',
  initial: initialState.ApplicationActiveTrack.duration,
  compareObjects: false
})

const currentPlaylistAtom = storageAtom({
  key: 'currentPlaylist',
  initial: initialState.ApplicationActiveTrack.currentPlaylist,
  compareObjects: false
})

const playbackSelectionAtom = storageAtom({
  key: 'playbackSelection',
  initial: initialState.ApplicationActiveTrack.playbackSelection,
  compareObjects: false
})

export const usePlaybackSelection = () => {
  const selection = useAtomValue(playbackSelectionAtom)
  const current = useCurrentPlaylist()
  const requested = usePlaybackRequested()
  return requested ? selection ?? current : current
}

export const usePlayed = (): boolean => {
  return useAtomValue(playedAtom)
}

export const useActiveTrack = () => {
  return useAtomValue(activeTrackAtom)
}

export const useCurrentTime = () => {
  return useAtomValue(currentTimeAtom)
}

export const useDuration = () => {
  return useAtomValue(durationAtom)
}

export const useCurrentPlaylist = () => {
  return useAtomValue(currentPlaylistAtom)
}

const subscribeTrackPlayback = (listener: () => void) => {
  const stopTrack = activeTrackAtom.subscribe(listener)
  const stopPlayed = playedAtom.subscribe(listener)
  return () => {
    stopTrack()
    stopPlayed()
  }
}

export const useTrackPlayback = (trackId: string): 'played' | 'paused' | null => useSyncExternalStore(
  subscribeTrackPlayback,
  () => {
    if (activeTrackAtom.get()?.id !== trackId) return null
    return playedAtom.get() ? 'played' : 'paused'
  }
)

export const useHasCurrentPlaylist = (): boolean => useSyncExternalStore(currentPlaylistAtom.subscribe, () => currentPlaylistAtom.get() != null)

const subscribePlaylistPlayback = (listener: () => void) => {
  const stops = [currentPlaylistAtom, playbackSelectionAtom, playbackRequestedAtom, playedAtom].map(source => source.subscribe(listener))
  return () => { stops.forEach(stop => { stop() }) }
}

const requestedPlayback = () => playbackRequestedAtom.get() ?? playedAtom.get()

type PlaylistPlayback = 'played' | 'paused' | null

export const usePlaylistPlayback = (playlist: commonTypes.Playlist | null): PlaylistPlayback => useSyncExternalStore(
  subscribePlaylistPlayback,
  () => {
    const current = currentPlaylistAtom.get()
    if (playlist == null || current == null || !samePlaylist(current, playlist)) return null
    return requestedPlayback() ? 'played' : 'paused'
  }
)

export const useMixPlayback = (mixId: string | undefined, mixOptions = '', mixEntityId = ''): PlaylistPlayback => useSyncExternalStore(
  subscribePlaylistPlayback,
  () => {
    const requested = requestedPlayback()
    const current = requested ? playbackSelectionAtom.get() ?? currentPlaylistAtom.get() : currentPlaylistAtom.get()
    if (current?.isVkMix !== true || current.mixId !== mixId || (current.mixOptions ?? '') !== mixOptions || (current.mixEntityId ?? '') !== mixEntityId) return null
    return requested ? 'played' : 'paused'
  }
)

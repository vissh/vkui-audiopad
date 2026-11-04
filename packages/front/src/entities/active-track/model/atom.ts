import { initialState } from '@vk-audiopad/common'
import { storageAtom, useAtomValue } from '@/shared/lib/atom'

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

export const usePlaybackRequested = (): boolean => {
  const requested = useAtomValue(playbackRequestedAtom)
  const played = usePlayed()
  return requested ?? played
}

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

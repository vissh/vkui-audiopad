import { initialState, type commonTypes } from '@vk-audiopad/common'
import { storageAtom, useAtomValue } from '@/shared/lib/atom'

const playedAtom = storageAtom({
  key: 'played',
  initial: initialState.ApplicationActiveTrack.played,
  compareObjects: false
})

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
  compareObjects: (prevPlaylist, newPlaylist): boolean => {
    return (
      prevPlaylist != null &&
      newPlaylist != null &&
      prevPlaylist.id === newPlaylist.id &&
      prevPlaylist.blockId === newPlaylist.blockId &&
      prevPlaylist.ownerId === newPlaylist.ownerId &&
      prevPlaylist.tracks.length === newPlaylist.tracks.length
    )
  }
})

export const usePlayed = (): boolean => {
  return useAtomValue(playedAtom)
}

export const setPlayed = (value: boolean) => {
  playedAtom.set(value)
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

export const setCurrentPlaylist = (value: commonTypes.Playlist) => {
  currentPlaylistAtom.set(value)
}

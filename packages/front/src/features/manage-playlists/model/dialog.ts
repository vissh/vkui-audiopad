import { type vkPlaylists, type commonTypes } from '@vk-audiopad/common'
import { atom } from '@/shared/lib/atom'

export type PlaylistDialogRequest =
  | { kind: 'create', userId: string, audioIds: string[], tracks?: commonTypes.TrackItem[] }
  | { kind: 'add', userId: string, track: commonTypes.TrackItem }
  | { kind: 'edit', userId: string, playlist: vkPlaylists.MusicPlaylist }

export const playlistDialogAtom = atom<PlaylistDialogRequest | null>(null)

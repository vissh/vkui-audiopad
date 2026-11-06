import { type commonTypes } from '@vk-audiopad/common'
import { atom } from '@/shared/lib/atom'

export type PlaylistDialogRequest =
  | { kind: 'create', userId: string, audioIds: string[] }
  | { kind: 'add', userId: string, track: commonTypes.TrackItem }

export const playlistDialogAtom = atom<PlaylistDialogRequest | null>(null)

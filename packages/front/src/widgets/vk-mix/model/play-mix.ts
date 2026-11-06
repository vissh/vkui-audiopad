import { type commonTypes } from '@vk-audiopad/common'
import { playOrPause } from '@/features/play-or-pause'
import { rememberMix } from '@/entities/vk-mix'

export const playMix = (userId: string, mixOptions = '', title = 'VK Микс'): void => {
  rememberMix(userId, mixOptions, title)
  const playlist: commonTypes.Playlist = {
    id: crypto.randomUUID(),
    ownerId: userId,
    blockId: '',
    title,
    tracks: [],
    isRadio: false,
    isVkMix: true,
    mixId: 'common',
    mixOptions,
    accessHash: '',
    nextOffset: '',
    hasMore: false,
    followHash: '',
    isFollowed: false
  }
  playOrPause('normal', null, playlist)
}

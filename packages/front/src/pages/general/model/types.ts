import { type commonTypes } from '@vk-audiopad/common'
import { type Album } from '@/shared/types'

export interface FetchGeneralResult {
  playlist: commonTypes.Playlist | null
  baseOnYourTastes: Album[]
  vkMusic: Album[]
}

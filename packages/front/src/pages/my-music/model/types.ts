import { type CatalogBlock, type TracksCatalogBlock } from '@/shared/types'

export interface FetchMyMusicResult {
  firstBlock: CatalogBlock | null
  otherBlocks: CatalogBlock[]
  lastTracksCatalogBlock: TracksCatalogBlock | null
}

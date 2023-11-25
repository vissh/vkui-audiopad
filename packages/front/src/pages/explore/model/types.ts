import { type CatalogBlock } from '@/shared/types'

export interface FetchMoreExploreArgs {
  nextFrom: string
  sectionId: string
}

export interface FetchExploreResult {
  nextFrom: string
  sectionId: string
  blocks: CatalogBlock[]
}

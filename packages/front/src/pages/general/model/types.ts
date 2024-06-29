import { type CatalogBlock } from '@/shared/types'

export interface FetchResult {
  nextFrom: string
  sectionId: string
  blocks: CatalogBlock[]
}

export interface FetchMoreArgs {
  nextFrom: string
  sectionId: string
}

import { type CatalogBlock } from '@/shared/types'

export interface FetchNextSectionArgs {
  nextFrom: string
  sectionId: string
  tokenCatalog?: boolean
}

export interface FetchAlbumsResult {
  nextFrom: string
  sectionId: string
  blocks: CatalogBlock[]
  tokenCatalog?: boolean
}

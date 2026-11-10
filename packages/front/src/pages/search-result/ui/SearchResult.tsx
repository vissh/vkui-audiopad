import { Group } from '@vkontakte/vkui'
import { memo, type FC } from 'react'
import { CatalogGallery } from '@/widgets/catalog-gallery'
import { Navigation } from '@/widgets/navigation'
import { CatalogBlockDataType } from '@/shared/types'
import { Content } from '@/shared/ui/content'
import { EmptyResult } from '@/shared/ui/empty-result'
import { useSearchData } from '../model/hooks'
import './SearchResult.css'

interface SearchResultProps {
  userId: string
  searchValue: string
}

export const SearchResult: FC<SearchResultProps> = ({ userId, searchValue }) => {
  const { data: blocks, isPending, error } = useSearchData(userId, searchValue)

  const [firstBlock, ...otherBlocks] = blocks ?? [null, null, null]

  return (
    <Content
      display={true}
      error={error}
    >
      <Group>
        <Navigation />

        {isPending
          ? <SearchPlaceholder mode='plain' />
          : <CatalogGallery
              mode='plain'
              isPending={false}
              loadingBlock='tracks'
              userId={userId}
              catalogBlock={firstBlock}
            />}

        {!isPending && firstBlock == null && <EmptyResult />}
      </Group>

      {otherBlocks.map((catalogBlock, index) => {
        if (!isPending && catalogBlock == null) return null
        if (isPending) return <SearchPlaceholder key={catalogBlock?.blockId ?? `pending-${index}`} mode='card' />
        return (
          <CatalogGallery
            key={catalogBlock?.blockId}
            mode='card'
            isPending={false}
            loadingBlock={catalogBlock?.dataType === CatalogBlockDataType.TRACKS ? 'tracks' : 'albums'}
            userId={userId}
            catalogBlock={catalogBlock}
          />
        )
      })}
    </Content>
  )
}

const SearchPlaceholder = memo(function SearchPlaceholder ({ mode }: { mode: 'plain' | 'card' }) {
  return (
    <Group mode={mode} role='status' aria-label='Загрузка подборки' aria-busy='true'>
      <div aria-hidden='true' className='vkap_search_placeholder'>
        <div className='vkap_search_placeholder_heading' />
        <div className='vkap_search_placeholder_content' />
      </div>
    </Group>
  )
})

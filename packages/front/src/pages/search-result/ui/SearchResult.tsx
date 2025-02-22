import { Group } from '@vkontakte/vkui'
import { type FC } from 'react'
import { CatalogGallery } from '@/widgets/catalog-gallery'
import { Navigation } from '@/widgets/navigation'
import { Content } from '@/shared/ui/content'
import { EmptyResult } from '@/shared/ui/empty-result'
import { useSearchData } from '../model/hooks'

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
      error={error}>
      <Group>
        <Navigation />

        <CatalogGallery
          mode='plain'
          isPending={isPending}
          loadingBlock='tracks'
          userId={userId}
          catalogBlock={firstBlock}
        />

        {!isPending && firstBlock == null && <EmptyResult />}
      </Group>

      {otherBlocks.map((catalogBlock) => (
        <CatalogGallery
          key={catalogBlock?.blockId}
          mode='card'
          isPending={isPending}
          loadingBlock='albums'
          userId={userId}
          catalogBlock={catalogBlock}
        />
      ))}
    </Content>
  )
}

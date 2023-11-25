import { Group } from '@vkontakte/vkui'
import { type FC } from 'react'
import { CatalogGallery } from '@/widgets/catalog-gallery'
import { Navigation } from '@/widgets/navigation'
import { ArtistCover } from '@/shared/ui/artist-cover'
import { Content } from '@/shared/ui/content'
import { EmptyResult } from '@/shared/ui/empty-result'
import { useArtistData } from '../model/hooks'

interface ArtistResultProps {
  userId: string
  artistId: string
  artistName: string
}

export const ArtistResult: FC<ArtistResultProps> = ({ userId, artistId, artistName }) => {
  const { data: fetchResult, isLoading, error } = useArtistData(userId, artistId)

  const [firstBlock, ...otherBlocks] = fetchResult?.blocks ?? [null, null, null]

  return (
    <Content
      display={true}
      error={error}>
      <Group>
        <Navigation>
          <ArtistCover
            title={isLoading ? '' : artistName}
            backgroundImage={fetchResult?.backgroundImage ?? ''}
          />
        </Navigation>

        <CatalogGallery
          mode='plain'
          isLoading={isLoading}
          loadingBlock='tracks'
          userId={userId}
          catalogBlock={firstBlock}
        />

        {!isLoading && firstBlock == null && <EmptyResult />}
      </Group>

      {otherBlocks.map((catalogBlock) => (
        <CatalogGallery
          key={catalogBlock?.blockId}
          mode='card'
          isLoading={isLoading}
          loadingBlock='albums'
          userId={userId}
          catalogBlock={catalogBlock}
        />
      ))}
    </Content>
  )
}

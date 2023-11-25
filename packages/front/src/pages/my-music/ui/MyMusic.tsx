import { Group } from '@vkontakte/vkui'
import { type FC } from 'react'
import { CatalogGallery } from '@/widgets/catalog-gallery'
import { Navigation } from '@/widgets/navigation'
import { TrackList } from '@/widgets/track-list'
import { InfinityContent } from '@/shared/ui/infinity-content'
import { useLoadMoreMyMusicTracksMutation, useMyMusicData } from '../model/hooks'

interface MyMusicProps {
  userId: string
  active: boolean
}

export const MyMusic: FC<MyMusicProps> = ({ userId, active }) => {
  const { data: fetchResult, isLoading, error } = useMyMusicData(userId, active)
  const loadMoreMutation = useLoadMoreMyMusicTracksMutation()

  const otherBlocks = isLoading ? [null, null] : (fetchResult?.otherBlocks ?? [])

  return (
    <InfinityContent
      display={active}
      hasMore={(fetchResult?.lastTracksCatalogBlock?.playlist.hasMore) ?? false}
      loadMoreMutation={loadMoreMutation}
      loadMoreArgs={fetchResult?.lastTracksCatalogBlock?.playlist}
      error={error}
    >
      <Group>
        <Navigation />

        <CatalogGallery
          mode='plain'
          isLoading={isLoading}
          loadingBlock='tracks'
          userId={userId}
          catalogBlock={fetchResult?.firstBlock}
        />
      </Group>

      {otherBlocks
        .map((catalogBlock, blockIndex) => (
          <CatalogGallery
            key={catalogBlock?.blockId}
            mode='card'
            isLoading={isLoading}
            loadingBlock={blockIndex % 2 === 0 ? 'albums' : 'tracks'}
            userId={userId}
            catalogBlock={catalogBlock}
          />
        ))}

      {(fetchResult?.lastTracksCatalogBlock) != null &&
        fetchResult.lastTracksCatalogBlock.playlist.tracks.length > 0 &&
        <Group>
          <TrackList
            isLoading={isLoading}
            playlist={fetchResult.lastTracksCatalogBlock.playlist}
            header={fetchResult.lastTracksCatalogBlock.playlist.title}
          />
        </Group>
      }
    </InfinityContent>
  )
}

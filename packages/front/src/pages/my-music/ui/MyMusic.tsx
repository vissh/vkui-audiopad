import { Group } from '@vkontakte/vkui'
import { type FC } from 'react'
import { CatalogGallery } from '@/widgets/catalog-gallery'
import { Navigation } from '@/widgets/navigation'
import { TrackList } from '@/widgets/track-list'
import { MyPlaylists } from '@/features/manage-playlists'
import { InfinityContent } from '@/shared/ui/infinity-content'
import { useLoadMoreMyMusicTracksMutation, useMyMusicData } from '../model/hooks'

interface MyMusicProps {
  userId: string
  active: boolean
}

export const MyMusic: FC<MyMusicProps> = ({ userId, active }) => {
  const { data: fetchResult, isPending, error } = useMyMusicData(userId, active)
  const loadMoreMutation = useLoadMoreMyMusicTracksMutation()

  const otherBlocks = isPending ? [null, null] : (fetchResult?.otherBlocks ?? [])

  return (
    <InfinityContent
      display={active}
      hasMore={(fetchResult?.lastTracksCatalogBlock?.playlist.hasMore) ?? false}
      paginationScope={JSON.stringify([userId, 'my-music', fetchResult?.lastTracksCatalogBlock?.playlist?.ownerId, fetchResult?.lastTracksCatalogBlock?.playlist?.id, fetchResult?.lastTracksCatalogBlock?.playlist?.blockId])}
      pageKey={fetchResult?.lastTracksCatalogBlock?.playlist?.nextOffset ?? ''}
      loadMoreMutation={loadMoreMutation}
      loadMoreArgs={fetchResult?.lastTracksCatalogBlock == null ? undefined : { userId, playlist: fetchResult.lastTracksCatalogBlock.playlist }}
      error={error}
    >
      <Group>
        <Navigation />

        <CatalogGallery
          mode='plain'
          isPending={isPending}
          loadingBlock='tracks'
          userId={userId}
          catalogBlock={fetchResult?.firstBlock}
        />
      </Group>

      <MyPlaylists userId={userId} active={active} />

      {otherBlocks
        .map((catalogBlock, blockIndex) => (
          <CatalogGallery
            key={catalogBlock?.blockId}
            mode='card'
            isPending={isPending}
            loadingBlock={blockIndex % 2 === 0 ? 'albums' : 'tracks'}
            userId={userId}
            catalogBlock={catalogBlock}
          />
        ))}

      {(fetchResult?.lastTracksCatalogBlock) != null &&
        fetchResult.lastTracksCatalogBlock.playlist.tracks.length > 0 &&
        <Group>
          <TrackList
            isPending={isPending}
            playlist={fetchResult.lastTracksCatalogBlock.playlist}
            header={fetchResult.lastTracksCatalogBlock.playlist.title}
          />
        </Group>}
    </InfinityContent>
  )
}

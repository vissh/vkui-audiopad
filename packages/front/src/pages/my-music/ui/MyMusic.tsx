import { vkPlaylists } from '@vk-audiopad/common'
import { Group } from '@vkontakte/vkui'
import { memo, useMemo } from 'react'
import { CatalogFeed } from '@/widgets/catalog-gallery'
import { Navigation } from '@/widgets/navigation'
import { FollowIcon } from '@/features/follow-album'
import { MyPlaylists } from '@/features/manage-playlists'
import { PlayPlaylistButton } from '@/features/play-or-pause-album'
import { InfinityContent } from '@/shared/ui/infinity-content'
import { useLoadMoreMyMusicTracksMutation, useMyMusicData } from '../model/hooks'

interface MyMusicProps {
  userId: string
  active: boolean
}

export const MyMusic = memo(function MyMusic ({ userId, active }: MyMusicProps) {
  const { data: fetchResult, isError, refetch } = useMyMusicData(userId, active)
  const loadMoreMutation = useLoadMoreMyMusicTracksMutation()

  const blocks = useMemo(() => [fetchResult?.firstBlock, ...(fetchResult?.otherBlocks ?? []), fetchResult?.lastTracksCatalogBlock].filter((block): block is NonNullable<typeof block> => block != null), [fetchResult])

  return (
    <InfinityContent
      display={active}
      hasMore={(fetchResult?.lastTracksCatalogBlock?.playlist.hasMore) ?? false}
      paginationScope={JSON.stringify([userId, 'my-music', fetchResult?.lastTracksCatalogBlock?.playlist?.ownerId, fetchResult?.lastTracksCatalogBlock?.playlist?.id, fetchResult?.lastTracksCatalogBlock?.playlist?.blockId])}
      pageKey={fetchResult?.lastTracksCatalogBlock?.playlist?.nextOffset ?? ''}
      loadMoreMutation={loadMoreMutation}
      loadMoreArgs={fetchResult?.lastTracksCatalogBlock == null ? undefined : { userId, playlist: fetchResult.lastTracksCatalogBlock.playlist }}
    >
      <Group>
        <Navigation />
      </Group>
      <CatalogFeed userId={userId} active={active} section='all' progressive existing={blocks} onRetry={() => { if (isError) void refetch() }} renderLibrary={showAllLink => <MyPlaylists userId={userId} active={active} showAllLink={showAllLink} renderAction={playlist => <><FollowIcon album={vkPlaylists.toPlaybackPlaylist(playlist)} /><PlayPlaylistButton userId={userId} album={vkPlaylists.toPlaybackPlaylist(playlist)} /></>} />} />
    </InfinityContent>
  )
})

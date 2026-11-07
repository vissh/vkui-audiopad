import { type commonTypes } from '@vk-audiopad/common'
import { Group, Placeholder, Spacing } from '@vkontakte/vkui'
import { type FC } from 'react'
import { Navigation } from '@/widgets/navigation'
import { TrackList } from '@/widgets/track-list'
import { InfinityContent } from '@/shared/ui/infinity-content'
import { useBlockPlaylistData, useLoadMoreBlockPlaylistTracksMutation } from '../model/hooks'

interface PlaylistTracksProps {
  userId: string
  playlist: commonTypes.Playlist
  fromId: string
}

export const PlaylistTracks: FC<PlaylistTracksProps> = ({ userId, playlist, fromId }) => {
  const { data: fetchResult, isPending, error } = useBlockPlaylistData(userId, playlist, fromId)
  const loadMoreMutation = useLoadMoreBlockPlaylistTracksMutation()

  return (
    <InfinityContent
      display={true}
      hasMore={(fetchResult?.playlist.hasMore) ?? false}
      paginationScope={JSON.stringify([userId, 'playlist-tracks', fetchResult?.playlist?.ownerId, fetchResult?.playlist?.id, fetchResult?.playlist?.blockId])}
      pageKey={fetchResult?.playlist?.nextOffset ?? ''}
      loadMoreMutation={loadMoreMutation}
      loadMoreArgs={fetchResult == null ? undefined : { userId, fromId, source: playlist, playlist: fetchResult.playlist }}
      error={error}
    >
      <Group>
        <Navigation />
        <Spacing />

        <TrackList
          isPending={isPending}
          playlist={fetchResult?.playlist}
          header={fetchResult?.playlist.title ?? playlist.title}
        />
        {!isPending && fetchResult?.playlist.tracks.length === 0 && !fetchResult.playlist.hasMore &&
          <Placeholder>В плейлисте пока нет треков. Добавьте их через «Добавить в плейлист» у нужной записи</Placeholder>}
      </Group>
    </InfinityContent>
  )
}

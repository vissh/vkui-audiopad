import { type commonTypes } from '@vk-audiopad/common'
import { Group, Spacing } from '@vkontakte/vkui'
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
      loadMoreMutation={loadMoreMutation}
      loadMoreArgs={fetchResult?.playlist}
      error={error}
    >
      <Group>
        <Navigation />
        <Spacing />

        <TrackList
          isPending={isPending}
          playlist={fetchResult?.playlist}
        />
      </Group>
    </InfinityContent>
  )
}

import { type commonTypes } from '@vk-audiopad/common'
import { Group, HorizontalScroll, List } from '@vkontakte/vkui'
import { type FC } from 'react'
import { TrackSkeleton } from '@/entities/track'
import { batched } from '@/shared/lib/utils'
import { openPlaylistPage } from '@/shared/model'
import { ShowAllLink, ShowAllLinkSkeleton } from '@/shared/ui/show-all-link'
import { SkeletonWrapper } from '@/shared/ui/skeleton-wrapper'
import { Track } from '../track/Track'

const rows = 3
const columns = 6
const columnWidth = 354

interface TrackGalleryProps {
  mode: 'plain' | 'card'
  isLoading: boolean
  userId: string
  playlist: commonTypes.Playlist | undefined | null
}

export const TrackGallery: FC<TrackGalleryProps> = ({ mode, isLoading, userId, playlist }) => {
  return (
    <SkeletonWrapper
      isLoading={isLoading}
      skeleton={<TrackGallerySkeleton mode={mode} />}
    >
      {playlist != null && (
        <Group
          mode={mode}
          header={
            <ShowAllLink
              title={playlist.title}
              showLink={playlist.tracks.length > 6}
              onClick={() => { openPlaylistPage(userId, playlist) }}
            />
          }
        >
          <HorizontalScroll>
            {batched(playlist.tracks, rows, columns).map((tracksWithIndexes, columnIndex) => (
              <List key={columnIndex} style={{ width: columnWidth, minWidth: columnWidth, display: 'block' }}>
                {tracksWithIndexes.map((track) => (
                  <Track
                    key={track.id}
                    playlist={playlist}
                    track={track}
                  />
                ))}
              </List>
            ))}
          </HorizontalScroll>
        </Group>
      )}
    </SkeletonWrapper>
  )
}

interface TrackGallerySkeletonProps {
  mode: 'plain' | 'card'
}

const TrackGallerySkeleton: FC<TrackGallerySkeletonProps> = ({ mode }) => {
  return (
    <Group
      mode={mode}
      header={<ShowAllLinkSkeleton />}
    >
      <HorizontalScroll>
        {Array.from(Array(columns).keys()).map((colIndex) => (
          <List key={colIndex} style={{ width: columnWidth, minWidth: columnWidth }}>
            {Array.from(Array(rows).keys()).map((rowIndex) => (
              <TrackSkeleton key={rowIndex} />
            ))}
          </List>
        ))}
      </HorizontalScroll>
    </Group>
  )
}

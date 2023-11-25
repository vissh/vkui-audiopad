import { type commonTypes } from '@vk-audiopad/common'
import { Group, HorizontalScroll, List } from '@vkontakte/vkui'
import { type FC } from 'react'
import { openPlaylistPage } from '@/entities/content-tab'
import { batched } from '@/shared/lib/utils'
import { ShowAllLink } from '@/shared/ui/show-all-link'
import { SkeletonWrapper } from '@/shared/ui/skeleton-wrapper'
import { Track } from '../track/Track'
import { TrackGallerySkeleton } from './TrackGallerySkeleton'

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
  const toTrackIndex = (track: commonTypes.TrackItem, index: number) => [track, index] as [commonTypes.TrackItem, number]
  const columnsTracks = playlist != null ? batched(playlist.tracks.map(toTrackIndex), rows, columns) : []

  return (
    <SkeletonWrapper
      mode={mode}
      isLoading={isLoading}
      skeleton={<TrackGallerySkeleton />}
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
            <div style={{ display: 'flex' }}>
              {columnsTracks.map((tracksWithIndexes, columnIndex) => (
                <List key={columnIndex} style={{ width: columnWidth, minWidth: columnWidth }}>
                  {tracksWithIndexes.map(([track, trackIndex]) => (
                    <Track
                      key={track.id}
                      playlist={playlist}
                      track={track}
                      trackIndex={trackIndex}
                    />
                  ))}
                </List>
              ))}
            </div>
          </HorizontalScroll>
        </Group>
      )}
    </SkeletonWrapper>
  )
}

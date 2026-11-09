import { type commonTypes } from '@vk-audiopad/common'
import { Group, List } from '@vkontakte/vkui'
import { type FC } from 'react'
import { TrackSkeleton } from '@/entities/track'
import { batched } from '@/shared/lib/utils'
import { openAlbumsPage, openPlaylistPage } from '@/shared/model'
import { HorizontalScroll } from '@/shared/ui/horizontal-scroll'
import { ShowAllLink, ShowAllLinkSkeleton } from '@/shared/ui/show-all-link'
import { SkeletonWrapper } from '@/shared/ui/skeleton-wrapper'
import { Track } from './Track'

const rows = 3
const columns = 6
const columnWidth = 354

interface TrackGalleryProps {
  hideTitle?: boolean
  mode: 'plain' | 'card'
  isPending: boolean
  userId: string
  playlist: commonTypes.Playlist | undefined | null
}

export const TrackGallery: FC<TrackGalleryProps> = ({ mode, isPending, userId, playlist, hideTitle = false }) => {
  return (
    <SkeletonWrapper
      isPending={isPending}
      skeleton={<TrackGallerySkeleton mode={mode} />}
    >
      {playlist != null && (
        <Group
          mode={mode}
          header={!hideTitle &&
            <ShowAllLink
              title={playlist.title}
              showLink={Boolean(playlist.catalogLink) || playlist.tracks.length > 6}
              onClick={() => { if (playlist.catalogLink) openAlbumsPage(playlist.title, playlist.catalogLink); else openPlaylistPage(userId, playlist) }}
            />}
        >
          {playlist.catalogLayout === 'list'
            ? <List>{playlist.tracks.map(track => <Track key={track.id} playlist={playlist} track={track} />)}</List>
            : <HorizontalScroll>
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
              </HorizontalScroll>}
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

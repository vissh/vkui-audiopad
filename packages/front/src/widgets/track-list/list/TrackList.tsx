import { type commonTypes } from '@vk-audiopad/common'
import { Group, Header } from '@vkontakte/vkui'
import { type FC } from 'react'
import { SkeletonWrapper } from '@/shared/ui/skeleton-wrapper'
import { Track } from '../track/Track'
import { SkeletonTitleTracks } from './TrackListSkeleton'

interface TrackListProps {
  isLoading: boolean
  playlist: commonTypes.Playlist | undefined
  header?: string
}

export const TrackList: FC<TrackListProps> = ({ isLoading, playlist, header }) => {
  return (
    <>
      <SkeletonWrapper
        mode='plain'
        isLoading={isLoading}
        skeleton={<SkeletonTitleTracks />}
      >
        {playlist != null &&
          <Group
            mode='plain'
            header={header != null && header.length > 0 && <Header>{header}</Header>}
          >
            {playlist.tracks.map((track, index) => (
              <Track
                key={track.id}
                playlist={playlist}
                track={track}
                trackIndex={index}
              />
            ))}
          </Group>
        }
      </SkeletonWrapper>
    </>
  )
}

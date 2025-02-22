import { type commonTypes } from '@vk-audiopad/common'
import { Group, Header } from '@vkontakte/vkui'
import { type FC } from 'react'
import { TrackSkeleton } from '@/entities/track'
import { SkeletonWrapper } from '@/shared/ui/skeleton-wrapper'
import { Track } from '../track/Track'

interface TrackListProps {
  isPending: boolean
  playlist: commonTypes.Playlist | undefined
  header?: string
}

export const TrackList: FC<TrackListProps> = ({ isPending, playlist, header }) => {
  return (
    <>
      <SkeletonWrapper
        isPending={isPending}
        skeleton={<TrackListSkeleton />}
      >
        {playlist != null &&
          <Group
            mode='plain'
            header={header != null && header.length > 0 && <Header>{header}</Header>}
          >
            {playlist.tracks.map((track) => (
              <Track
                key={track.id}
                playlist={playlist}
                track={track}
              />
            ))}
          </Group>
        }
      </SkeletonWrapper>
    </>
  )
}

const TrackListSkeleton: FC = () => {
  return (
    <Group mode='plain'>
      {Array.from(Array(10).keys()).map((index) => (
        <TrackSkeleton key={index} />
      ))}
    </Group>
  )
}

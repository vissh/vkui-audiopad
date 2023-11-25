import { type commonTypes } from '@vk-audiopad/common'
import { type FC } from 'react'
import { getTrackState } from '@/widgets/track-list'
import { SearchArtist } from '@/features/search-artist'
import { useActiveTrack, usePlayed } from '@/entities/active-track'
import { TrackCell } from '@/entities/track'

interface EditableTrackProps {
  track: commonTypes.TrackItem
  trackIndex: number
  onDragFinish: ({ from, to }: { from: number, to: number }) => void
  onRemove: (index: number) => void
}

export const EditableTrack: FC<EditableTrackProps> = ({ track, trackIndex, onDragFinish, onRemove }) => {
  const activeTrack = useActiveTrack()
  const played = usePlayed()

  const trackState = getTrackState(track, activeTrack, played)

  return (
    <TrackCell
      title={track.title}
      artist={<SearchArtist track={track} />}
      duration={0}
      image={track.image}
      trackState={trackState}
      editMode={true}
      onRemove={() => { onRemove(trackIndex) }}
      onDragFinish={onDragFinish}
    />
  )
}

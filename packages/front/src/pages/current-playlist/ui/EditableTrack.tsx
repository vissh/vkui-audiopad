import { type commonTypes } from '@vk-audiopad/common'
import { Icon20ChevronUp, Icon24ChevronDown } from '@vkontakte/icons'
import { IconButton } from '@vkontakte/vkui'
import { type FC } from 'react'
import { getTrackState } from '@/widgets/track-list'
import { SearchArtist } from '@/features/search-artist'
import { useTrackPlayback } from '@/entities/active-track'
import { TrackCell } from '@/entities/track'

interface EditableTrackProps {
  track: commonTypes.TrackItem
  scrollAnchor: string
  trackIndex: number
  trackCount: number
  onDragFinish: ({ from, to }: { from: number, to: number }) => void
  onRemove: (index: number) => void
}

export const EditableTrack: FC<EditableTrackProps> = ({ track, scrollAnchor, trackIndex, trackCount, onDragFinish, onRemove }) => {
  const playback = useTrackPlayback(track.id)

  const trackState = getTrackState(track, playback == null ? null : track, playback === 'played')

  return (
    <TrackCell
      scrollAnchor={scrollAnchor}
      title={track.title}
      artist={<SearchArtist track={track} />}
      duration={0}
      image={track.image}
      trackState={trackState}
      editMode={true}
      onRemove={() => { onRemove(trackIndex) }}
      onDragFinish={onDragFinish}
      actions={
        <>
          <IconButton aria-label={`Выше: ${track.title}`} aria-disabled={trackIndex === 0} onClick={() => { if (trackIndex > 0) onDragFinish({ from: trackIndex, to: trackIndex - 1 }) }}><Icon20ChevronUp /></IconButton>
          <IconButton aria-label={`Ниже: ${track.title}`} aria-disabled={trackIndex === trackCount - 1} onClick={() => { if (trackIndex < trackCount - 1) onDragFinish({ from: trackIndex, to: trackIndex + 1 }) }}><Icon24ChevronDown /></IconButton>
        </>
      }
    />
  )
}

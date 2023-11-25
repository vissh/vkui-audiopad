import { commonTypes } from '@vk-audiopad/common'
import { useState, type FC } from 'react'
import { AddToMyMusicButton } from '@/features/add-to-my-music'
import { AddToQueueButton } from '@/features/add-to-queue'
import { DeleteFromMyMusicButton, DeleteFromMyMusicWithRestoreButton } from '@/features/delete-from-my-music'
import { playOrPause } from '@/features/play-or-pause'
import { RestoreButton, deletedTrackForRestore } from '@/features/restore'
import { SearchArtist } from '@/features/search-artist'
import { SimilarButton } from '@/features/similar'
import { useActiveTrack, useCurrentPlaylist, usePlayed } from '@/entities/active-track'
import { useSessionUserId } from '@/entities/session'
import { TrackCell } from '@/entities/track'
import { getActionButtons, getTrackState } from './utils'

interface TrackProps {
  playlist: commonTypes.Playlist
  track: commonTypes.TrackItem
  trackIndex: number
}

export const Track: FC<TrackProps> = ({ playlist, track: originalTrack, trackIndex }) => {
  const userId = useSessionUserId()
  const currentPlaylist = useCurrentPlaylist()
  const activeTrack = useActiveTrack()
  const played = usePlayed()

  const [track, setTrack] = useState(originalTrack)
  const [addedToMyMusic, setAddedToMyMusic] = useState(false)
  const [deletedFromMyMusic, setDeletedFromMyMusic] = useState(false)

  const trackState = getTrackState(track, activeTrack, played)

  const actionButtons = getActionButtons({
    userId,
    track,
    trackState,
    activeTrack,
    currentPlaylistExists: currentPlaylist != null,
    addedToMyMusic,
    deletedFromMyMusic
  })

  return (
    <TrackCell
      title={track.title}
      artist={<SearchArtist track={track} />}
      duration={track.duration}
      image={track.image}
      trackState={trackState}
      onClick={() => { playOrPause(trackState, trackIndex, playlist) }}
      actions={
        <>
          {actionButtons.has('similar') && (
            <SimilarButton
              size='s'
              userId={userId}
              track={track}
            />
          )}

          {actionButtons.has('addToQueue') && (
            <AddToQueueButton track={track} />
          )}

          {actionButtons.has('add') && (
            <AddToMyMusicButton
              size='s'
              track={track}
              onAfterAdd={(newTrack) => {
                setAddedToMyMusic(true)
                setTrack(newTrack)
              }}
            />
          )}

          {actionButtons.has('delete') && (
            <DeleteFromMyMusicButton
              size='s'
              track={track}
              onAfterDelete={() => {
                deletedTrackForRestore.add(track)
                setAddedToMyMusic(false)
                setTrack(originalTrack)
              }}
            />
          )}

          {actionButtons.has('deleteWithRestore') && (
            <DeleteFromMyMusicWithRestoreButton
              track={track}
              onAfterDelete={() => {
                deletedTrackForRestore.pop(track)
                setTrack({ ...track, flags: track.flags | commonTypes.TrackFlagBit.CLAIMED })
                setDeletedFromMyMusic(true)
              }}
            />
          )}

          {actionButtons.has('restore') && (
            <RestoreButton
              track={track}
              onAfterRestore={() => {
                setTrack(originalTrack)
                setDeletedFromMyMusic(false)
              }}
            />
          )}
        </>
      }
    />
  )
}

import { commonTypes } from '@vk-audiopad/common'
import { memo, useRef, useState } from 'react'
import { AddToMyMusicButton } from '@/features/add-to-my-music'
import { AddToQueueButton } from '@/features/add-to-queue'
import { DeleteFromMyMusicButton, DeleteFromMyMusicWithRestoreButton } from '@/features/delete-from-my-music'
import { AddTrackToPlaylistButton } from '@/features/manage-playlists'
import { playOrPause } from '@/features/play-or-pause'
import { RestoreButton, deletedTrackForRestore, useRestoreWindow } from '@/features/restore'
import { SearchArtist } from '@/features/search-artist'
import { SimilarButton } from '@/features/similar'
import { TrackMixButton } from '@/features/track-mix'
import { useHasCurrentPlaylist, useTrackPlayback } from '@/entities/active-track'
import { useSessionUserId } from '@/entities/session'
import { TrackCell } from '@/entities/track'
import { getActionButtons, getTrackState } from './utils'

interface TrackProps {
  playlist: commonTypes.Playlist
  track: commonTypes.TrackItem
}

export const Track = memo(function Track ({ playlist, track: originalTrack }: TrackProps) {
  const userId = useSessionUserId()
  const currentPlaylistExists = useHasCurrentPlaylist()

  const [track, setTrack] = useState(originalTrack)
  const [addedToMyMusic, setAddedToMyMusic] = useState(false)
  const [deletedInWindow, setDeletedInWindow] = useState<number | null>(null)
  const deletedFromMyMusic = deletedInWindow != null
  const playback = useTrackPlayback(track.id)

  const restoreWindow = useRestoreWindow(deletedFromMyMusic)
  const deleteWindow = useRef(deletedTrackForRestore.window())
  const trackState = getTrackState(track, playback == null ? null : track, playback === 'played')

  const actionButtons = getActionButtons({
    userId,
    track,
    trackState,
    activeTrack: playback == null ? null : track,
    currentPlaylistExists,
    addedToMyMusic,
    deletedFromMyMusic
  })

  if (deletedInWindow != null && deletedInWindow !== restoreWindow) return null

  return (
    <TrackCell
      scrollAnchor={JSON.stringify([playlist.ownerId, playlist.id, track.id])}
      title={track.title}
      artist={<SearchArtist track={track} />}
      duration={track.duration}
      image={track.image}
      trackState={trackState}
      removed={deletedFromMyMusic}
      onClick={() => { playOrPause(trackState, track.id, playlist) }}
      actions={
        <>
          {actionButtons.has('addToQueue') && <AddToQueueButton track={track} />}
          {!deletedFromMyMusic && !playlist.isRadio && <TrackMixButton track={track} size='s' />}
          {actionButtons.has('similar') && (
            <SimilarButton
              size='s'
              userId={userId}
              track={track}
            />
          )}

          {!deletedFromMyMusic && <AddTrackToPlaylistButton track={track} size='s' />}

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
                deletedTrackForRestore.remove(track)
                setAddedToMyMusic(false)
                setTrack(originalTrack)
              }}
            />
          )}

          {actionButtons.has('deleteWithRestore') && (
            <DeleteFromMyMusicWithRestoreButton
              track={track}
              onBeforeDelete={() => { deleteWindow.current = deletedTrackForRestore.window() }}
              onAfterDelete={() => {
                deletedTrackForRestore.add(track, deleteWindow.current)
                setTrack({ ...track, flags: track.flags | commonTypes.TrackFlagBit.CLAIMED })
                setDeletedInWindow(deleteWindow.current)
              }}
            />
          )}

          {actionButtons.has('restore') && (
            <RestoreButton
              track={track}
              onAfterRestore={() => {
                setTrack(originalTrack)
                setDeletedInWindow(null)
              }}
            />
          )}
        </>
      }
    />
  )
})

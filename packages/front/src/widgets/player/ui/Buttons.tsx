import { commonTypes } from '@vk-audiopad/common'
import { type FC } from 'react'
import { AddToMyMusicButton } from '@/features/add-to-my-music'
import { DeleteFromMyMusicButton } from '@/features/delete-from-my-music'
import { AddTrackToPlaylistButton } from '@/features/manage-playlists'
import { SimilarButton } from '@/features/similar'
import { TrackMixButton } from '@/features/track-mix'
import { useActiveTrack } from '@/entities/active-track'
import { useSessionUserId } from '@/entities/session'
import { atom, useAtomValue } from '@/shared/lib/atom'
import { LyricsButton } from './LyricsButton'

const initialAddedTracks: Record<string, commonTypes.TrackItem> = {}
const latestAddedTracksAtom = atom(initialAddedTracks)

export const Buttons: FC = () => {
  const userId = useSessionUserId()
  const activeTrack = useActiveTrack()

  const latestAddedTracks = useAtomValue(latestAddedTracksAtom)
  const libraryKey = JSON.stringify([userId, activeTrack?.id])

  const activeTrackExists = activeTrack != null
  const canAdd = activeTrackExists && (activeTrack.flags & commonTypes.TrackFlagBit.CAN_ADD) !== 0
  const someoneElsesTrack = activeTrackExists && userId !== activeTrack.id.split('_')[0]

  return (
    <>
      {activeTrackExists && (
        <div className='vkap_player_action_group' role='group' aria-label='Сохранение трека'>
          {canAdd && someoneElsesTrack && (
            latestAddedTracks[libraryKey] != null
              ? <DeleteFromMyMusicButton
                  track={latestAddedTracks[libraryKey]}
                  onAfterDelete={() => {
                    const { [libraryKey]: _deleted, ...rest } = latestAddedTracksAtom.get()
                    latestAddedTracksAtom.set(rest)
                  }}
                />
              : <AddToMyMusicButton
                  track={activeTrack}
                  onAfterAdd={(addedTrack) => {
                    latestAddedTracksAtom.set({ ...latestAddedTracksAtom.get(), [libraryKey]: addedTrack })
                  }}
                />
          )}
          <AddTrackToPlaylistButton track={activeTrack} />
        </div>
      )}
      {activeTrackExists && (
        <div className='vkap_player_action_group' role='group' aria-label='Рекомендации и текст'>
          <TrackMixButton track={activeTrack} />
          <SimilarButton userId={userId} track={activeTrack} />
          <LyricsButton key={activeTrack.id} track={activeTrack} userId={userId} />
        </div>
      )}
    </>
  )
}

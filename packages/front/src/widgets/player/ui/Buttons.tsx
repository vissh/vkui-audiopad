import { commonTypes } from '@vk-audiopad/common'
import { type FC } from 'react'
import { AddToMyMusicButton } from '@/features/add-to-my-music'
import { CastToStatusButton } from '@/features/cast-to-status'
import { DeleteFromMyMusicButton } from '@/features/delete-from-my-music'
import { RepeatButton } from '@/features/repeat'
import { ShuffleButton } from '@/features/shuffle'
import { SimilarButton } from '@/features/similar'
import { useActiveTrack } from '@/entities/active-track'
import { useSessionUserId } from '@/entities/session'
import { atom, useAtomValue } from '@/shared/lib/atom'

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
      {canAdd && someoneElsesTrack && (
        <>
          {latestAddedTracks[libraryKey] != null
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
              />}
        </>
      )}
      <ShuffleButton />
      <RepeatButton />
      <CastToStatusButton />
      {activeTrackExists &&
        <SimilarButton
          padding
          userId={userId}
          track={activeTrack}
        />}
    </>
  )
}

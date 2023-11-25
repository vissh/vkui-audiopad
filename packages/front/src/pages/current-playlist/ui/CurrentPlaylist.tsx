import { type commonTypes } from '@vk-audiopad/common'
import { Icon20Cancel, Icon20Check, Icon20ListPenOutline } from '@vkontakte/icons'
import { Button, Group, Header, List } from '@vkontakte/vkui'
import { useEffect, useState, type FC } from 'react'
import { Navigation } from '@/widgets/navigation'
import { Track } from '@/widgets/track-list'
import { setCurrentPlaylist, useCurrentPlaylist } from '@/entities/active-track'
import { sendMessage } from '@/shared/lib/send-message'
import { InfinityContent } from '@/shared/ui/infinity-content'
import { useLoadMorePlaylistTracksMutation } from '../model/hooks'
import { EditableTrack } from './EditableTrack'

interface CurrentPlaylistProps {
  active: boolean
}

export const CurrentPlaylist: FC<CurrentPlaylistProps> = ({ active }) => {
  const currentPlaylist = useCurrentPlaylist()

  const [editMode, setEditMode] = useState(false)
  const [playlist, setPlaylist] = useState<commonTypes.Playlist | null>(null)
  const [actions, setActions] = useState<commonTypes.EditActions>([])

  const loadMoreMutation = useLoadMorePlaylistTracksMutation(playlist)

  useEffect(() => {
    if (currentPlaylist != null) {
      setPlaylist({ ...currentPlaylist, tracks: [...currentPlaylist.tracks] })
    }
  }, [currentPlaylist])

  const openEditMode = () => {
    if (currentPlaylist == null) {
      return
    }
    setPlaylist({ ...currentPlaylist, tracks: [...currentPlaylist.tracks] })
    setEditMode(true)
  }

  const accept = () => {
    if (playlist == null || currentPlaylist == null) {
      return
    }

    if (actions.length > 0) {
      sendMessage({
        type: 'edit-current-playlist',
        playlist,
        oldPlaylist: currentPlaylist,
        actions
      })
      setCurrentPlaylist(playlist)
    } else {
      setPlaylist({ ...currentPlaylist, tracks: [...currentPlaylist.tracks] })
    }
    setActions([])
    setEditMode(false)
  }

  const cancel = () => {
    if (currentPlaylist != null) {
      setPlaylist({ ...currentPlaylist, tracks: [...currentPlaylist.tracks] })
    }
    setActions([])
    setEditMode(false)
  }

  const moveTrack = ({ from, to }: { from: number, to: number }) => {
    if (playlist != null) {
      const tracks = [...playlist.tracks]
      tracks.splice(from, 1)
      tracks.splice(to, 0, playlist.tracks[from])
      setPlaylist({ ...playlist, tracks })
      setActions([...actions, ['move', from, to]])
    }
  }

  const removeTrack = (index: number) => {
    if (playlist != null) {
      playlist.tracks.splice(index, 1)
      setPlaylist({ ...playlist })
      setActions([...actions, ['remove', index]])
    }
  }

  return (
    <InfinityContent
      display={active}
      hasMore={(playlist?.hasMore) ?? false}
      loadMoreMutation={loadMoreMutation}
      loadMoreArgs={playlist}
    >
      <Group>
        <Navigation />

        <Group
          mode='plain'
          header={
            <Header
              aside={
                editMode
                  ? <>
                    <Button
                      key='acceptButton'
                      mode='tertiary'
                      before={<Icon20Check />}
                      style={{ marginBottom: '0px' }}
                      onClick={accept}
                    >
                      Применить
                    </Button>
                    <Button
                      key='cancelButton'
                      mode='tertiary'
                      appearance='negative'
                      before={<Icon20Cancel />}
                      style={{ marginBottom: '0px' }}
                      onClick={cancel}
                    >
                      Отмена
                    </Button>
                  </>
                  : <Button
                    key='editButton'
                    mode='tertiary'
                    before={<Icon20ListPenOutline />}
                    style={{ marginBottom: '0px' }}
                    onClick={openEditMode}
                  >
                    Режим редактирования
                  </Button>
              }
            >
              {currentPlaylist?.title}
            </Header>
          }
        >
          <List>
            {currentPlaylist != null && (playlist ?? currentPlaylist).tracks.map((track, index) => (
              <>
                {editMode
                  ? <EditableTrack
                    key={track.id}
                    track={track}
                    trackIndex={index}
                    onDragFinish={moveTrack}
                    onRemove={removeTrack}
                  />
                  : <Track
                    key={track.id}
                    playlist={playlist ?? currentPlaylist}
                    track={track}
                    trackIndex={index}
                  />
                }
              </>
            ))}
          </List>
        </Group>
      </Group>
    </InfinityContent>
  )
}

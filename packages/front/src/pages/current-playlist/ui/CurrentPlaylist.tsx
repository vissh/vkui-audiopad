import { commonTypes } from '@vk-audiopad/common'
import { Icon20Cancel, Icon20Check, Icon20ListPenOutline } from '@vkontakte/icons'
import { Button, ButtonGroup, Group, Header, List } from '@vkontakte/vkui'
import { Fragment, memo, useState } from 'react'
import { Navigation } from '@/widgets/navigation'
import { Track } from '@/widgets/track-list'
import { SaveQueueButton } from '@/features/manage-playlists'
import { useCurrentPlaylist } from '@/entities/active-track'
import { sendMessage } from '@/shared/lib/send-message'
import { InfinityContent } from '@/shared/ui/infinity-content'
import { useLoadMorePlaylistTracksMutation } from '../model/hooks'
import { EditableTrack } from './EditableTrack'

interface CurrentPlaylistProps {
  active: boolean
}

export const CurrentPlaylist = memo(function CurrentPlaylist ({ active }: CurrentPlaylistProps) {
  const currentPlaylist = useCurrentPlaylist()

  const [editMode, setEditMode] = useState(false)
  const [{ playlist, actions }, setDraft] = useState<{ playlist: commonTypes.Playlist | null, actions: commonTypes.EditActions }>({
    playlist: currentPlaylist != null ? { ...currentPlaylist, tracks: [...currentPlaylist.tracks] } : null,
    actions: []
  })

  const loadMoreMutation = useLoadMorePlaylistTracksMutation()

  // keep the local editable copy in sync with the stored playlist
  const [syncedPlaylist, setSyncedPlaylist] = useState(currentPlaylist)
  if (currentPlaylist !== syncedPlaylist) {
    setSyncedPlaylist(currentPlaylist)
    setDraft({ playlist: currentPlaylist == null ? null : { ...currentPlaylist, tracks: [...currentPlaylist.tracks] }, actions: [] })
    setEditMode(false)
  }

  const openEditMode = () => {
    if (currentPlaylist == null) {
      return
    }
    setDraft({ playlist: { ...currentPlaylist, tracks: [...currentPlaylist.tracks] }, actions: [] })
    setEditMode(true)
  }

  const accept = () => {
    if (playlist == null || currentPlaylist == null) {
      return
    }

    if (actions.length > 0) {
      sendMessage({
        target: commonTypes.MessageTarget.SERVICE_WORKER,
        type: commonTypes.MessageType.EDIT_CURRENT_PLAYLIST,
        playlist,
        oldPlaylist: currentPlaylist,
        actions
      })
    }
    setDraft({ playlist: { ...currentPlaylist, tracks: [...currentPlaylist.tracks] }, actions: [] })
    setEditMode(false)
  }

  const cancel = () => {
    setDraft({ playlist: currentPlaylist == null ? null : { ...currentPlaylist, tracks: [...currentPlaylist.tracks] }, actions: [] })
    setEditMode(false)
  }

  const moveTrack = ({ from, to }: { from: number, to: number }) => {
    setDraft(previous => {
      if (previous.playlist == null || !Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= previous.playlist.tracks.length || to >= previous.playlist.tracks.length || from === to) return previous
      const tracks = [...previous.playlist.tracks]
      const [track] = tracks.splice(from, 1)
      tracks.splice(to, 0, track)
      return { playlist: { ...previous.playlist, tracks }, actions: [...previous.actions, ['move', from, to]] }
    })
  }

  const removeTrack = (index: number) => {
    setDraft(previous => {
      if (previous.playlist == null || !Number.isInteger(index) || index < 0 || index >= previous.playlist.tracks.length) return previous
      return { playlist: { ...previous.playlist, tracks: previous.playlist.tracks.filter((_, trackIndex) => trackIndex !== index) }, actions: [...previous.actions, ['remove', index]] }
    })
  }

  return (
    <InfinityContent
      display={active}
      hasMore={!editMode && ((playlist?.hasMore) ?? false)}
      paginationScope={JSON.stringify(['current-playlist', playlist?.ownerId, playlist?.id, playlist?.blockId])}
      pageKey={playlist?.nextOffset ?? ''}
      loadMoreMutation={loadMoreMutation}
      loadMoreArgs={playlist}
    >
      <Group>
        <Navigation />

        <Group
          mode='plain'
          header={
            <Header
              after={
                editMode
                  ? <ButtonGroup align='center' gap='s'>
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
                    </ButtonGroup>
                  : <ButtonGroup align='center' gap='s'>
                      {currentPlaylist != null && !currentPlaylist.isRadio && <SaveQueueButton />}
                      <Button
                        key='editButton'
                        mode='tertiary'
                        before={<Icon20ListPenOutline />}
                        style={{ marginBottom: '0px' }}
                        onClick={openEditMode}
                      >
                        Режим редактирования
                      </Button>
                    </ButtonGroup>
              }
            >
              {currentPlaylist?.title}
            </Header>
          }
        >
          <List>
            {currentPlaylist != null && (playlist ?? currentPlaylist).tracks.map((track, index) => (
              <Fragment key={track.id}>
                {editMode
                  ? <EditableTrack
                      track={track}
                      trackIndex={index}
                      trackCount={(playlist ?? currentPlaylist).tracks.length}
                      onDragFinish={moveTrack}
                      onRemove={removeTrack}
                    />
                  : <Track
                      playlist={playlist ?? currentPlaylist}
                      track={track}
                    />}
              </Fragment>
            ))}
          </List>
        </Group>
      </Group>
    </InfinityContent>
  )
})

import { commonTypes } from '@vk-audiopad/common'
import { Icon20Add, Icon20PlaylistOutline, Icon24PlaylistOutline, Icon48AddOutline } from '@vkontakte/icons'
import { Button, Snackbar, Tappable } from '@vkontakte/vkui'
import { useEffect, useRef, useState } from 'react'
import { useSessionUserId } from '@/entities/session'
import { showNotification } from '@/shared/model'
import { TooltipIconButton } from '@/shared/ui/tooltip-icon-button'
import { playlistDialogAtom } from '../model/dialog'

export const CreatePlaylistButton = ({ tile = false }: { tile?: boolean }) => {
  const userId = useSessionUserId()
  const open = () => { playlistDialogAtom.set({ kind: 'create', userId, audioIds: [] }) }
  if (tile) {
    return (
      <Tappable Component='button' type='button' className='vkap_playlist_tile' disabled={userId.length === 0} onClick={open}>
        <span className='vkap_playlist_tile_cover vkap_playlist_tile_create'><Icon48AddOutline /></span>
        <span className='vkap_playlist_tile_title'>Создать плейлист</span>
      </Tappable>
    )
  }
  return <Button mode='tertiary' before={<Icon20Add />} disabled={userId.length === 0} onClick={open}>Создать плейлист</Button>
}

export const SaveQueueButton = () => {
  const userId = useSessionUserId()
  const running = useRef(false)
  const mounted = useRef(true)
  const [pending, setPending] = useState(false)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])
  const open = async () => {
    if (running.current) return
    running.current = true
    setPending(true)
    try {
      // Loaded TrackItems are only a subset; preserve full order and access keys.
      const snapshot = await chrome.storage.local.get(['audiosIds'])
      const ids: unknown = snapshot.audiosIds
      if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id): id is commonTypes.AudioTuple => Array.isArray(id) && id.length === 2 && id.every(value => typeof value === 'string'))) throw new Error('Queue unavailable')
      if (mounted.current) playlistDialogAtom.set({ kind: 'create', userId, audioIds: ids.map(([id, key]) => key.length > 0 ? `${id}_${key}` : id) })
    } catch {
      if (mounted.current) showNotification(<Snackbar onClosed={() => { showNotification(null) }}>Не удалось прочитать очередь. Дождитесь загрузки треков и попробуйте снова</Snackbar>)
    } finally {
      running.current = false
      if (mounted.current) setPending(false)
    }
  }
  return <Button mode='tertiary' disabled={userId.length === 0} aria-disabled={pending || undefined} loading={pending} onClick={() => { void open() }}>Сохранить как плейлист</Button>
}

export const AddTrackToPlaylistButton = ({ track, size = 'm' }: { track: commonTypes.TrackItem, size?: 's' | 'm' }) => {
  const userId = useSessionUserId()
  if (userId.length === 0 || (track.flags & commonTypes.TrackFlagBit.CLAIMED) !== 0) return null
  return <TooltipIconButton text='Добавить в плейлист' icon={size === 's' ? Icon20PlaylistOutline : Icon24PlaylistOutline} onClick={() => { playlistDialogAtom.set({ kind: 'add', userId, track }) }} />
}

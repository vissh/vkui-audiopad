import { vkPlaylists } from '@vk-audiopad/common'
import { Button, ButtonGroup, Div, FormItem, Input, ModalPage, ModalPageHeader, PanelHeaderClose, Snackbar, Textarea, Footnote, useModalManager, type CustomModalProps, type OpenModalPageProps } from '@vkontakte/vkui'
import { useEffect, useRef, useState } from 'react'
import { useSessionUserId } from '@/entities/session'
import { useAtom } from '@/shared/lib/atom'
import { showNotification } from '@/shared/model'
import { useRefreshPlaylists } from '../api/playlists'
import { playlistDialogAtom, type PlaylistDialogRequest } from '../model/dialog'
import { PlaylistList } from './PlaylistList'

export const PlaylistDialogs = () => {
  const userId = useSessionUserId()
  const [request, setRequest] = useAtom(playlistDialogAtom)
  const [api, holder] = useModalManager({ saveHistory: false })
  useEffect(() => {
    if (request == null) return
    setRequest(null)
    if (request.userId !== userId || userId.length === 0) return
    api.openCustomModalPage({ component: PlaylistDialog, additionalProps: { request }, baseProps: { dynamicContentHeight: true } })
  }, [request, setRequest, userId, api])
  return holder
}

export const PlaylistDialog = ({ request, modalProps, close }: CustomModalProps<OpenModalPageProps, { request: PlaylistDialogRequest }>) => {
  const [creating, setCreating] = useState(request.kind === 'create')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  const running = useRef(false)
  const mounted = useRef(true)
  const refresh = useRefreshPlaylists(request.userId)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])
  const dismiss = () => { mounted.current = false; close() }

  const run = async (action: () => Promise<unknown>, message: string) => {
    if (running.current) return
    running.current = true
    setPending(true)
    setFailed(false)
    try {
      await action()
      if (!mounted.current) return
      refresh()
      showNotification(<Snackbar onClosed={() => { showNotification(null) }}>{message}</Snackbar>)
      dismiss()
    } catch {
      if (mounted.current) setFailed(true)
    } finally {
      running.current = false
      if (mounted.current) setPending(false)
    }
  }

  const create = () => {
    if (title.trim().length === 0) return
    const audioIds = request.kind === 'create' ? request.audioIds : [request.track.accessKey.length > 0 ? `${request.track.id}_${request.track.accessKey}` : request.track.id]
    void run(async () => await vkPlaylists.createPlaylist(request.userId, title, description, audioIds), 'Плейлист сохранён в VK')
  }

  return (
    <ModalPage {...modalProps} onClose={dismiss} header={<ModalPageHeader before={<PanelHeaderClose onClick={dismiss} />}>{creating ? 'Новый плейлист' : 'Добавить в плейлист'}</ModalPageHeader>}>
      {creating
        ? <form onSubmit={event => { event.preventDefault(); create() }}>
            <FormItem top='Название' htmlFor='playlist-title'><Input id='playlist-title' value={title} autoFocus readOnly={pending} onChange={event => { setTitle(event.target.value) }} /></FormItem>
            <FormItem top='Описание' htmlFor='playlist-description'><Textarea id='playlist-description' value={description} readOnly={pending} onChange={event => { setDescription(event.target.value) }} /></FormItem>
            <Div><Footnote>Треков: {request.kind === 'add' ? 1 : request.audioIds.length}. Плейлист будет доступен в вашей музыке VK</Footnote></Div>
            <Div><ButtonGroup><Button type='submit' disabled={title.trim().length === 0} aria-disabled={pending || undefined} loading={pending}>Сохранить</Button><Button mode='secondary' onClick={dismiss}>Отмена</Button></ButtonGroup></Div>
          </form>
        : <>
            <Div><Button mode='secondary' aria-disabled={pending || undefined} onClick={() => { if (!running.current) setCreating(true) }}>Создать плейлист</Button></Div>
            {pending && <Div><Footnote role='status'>Добавляем трек…</Footnote></Div>}
            {request.kind === 'add' && <PlaylistList userId={request.userId} busy={pending} onSelect={playlist => { void run(async () => { await vkPlaylists.addTrackToPlaylist(request.userId, playlist.id, request.track.id, request.track.accessKey) }, 'Трек добавлен в плейлист') }} />}
          </>}
      {failed && <Div><Footnote role='alert'>Не удалось подтвердить сохранение. Проверьте плейлисты в VK перед повторной попыткой</Footnote></Div>}
    </ModalPage>
  )
}

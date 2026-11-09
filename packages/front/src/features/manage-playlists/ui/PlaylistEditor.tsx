import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { vkPlaylistCover, vkPlaylists, type commonTypes } from '@vk-audiopad/common'
import { Icon20ChevronUp, Icon24ChevronDown, Icon20DeleteOutline } from '@vkontakte/icons'
import { Button, ButtonGroup, Checkbox, Div, File, Footnote, FormItem, Header, IconButton, Input, List, Search, SimpleCell, Spinner, Textarea } from '@vkontakte/vkui'
import { useEffect, useRef, useState } from 'react'
import { MediaCover } from '@/shared/ui/media-cover'
import { type PlaylistDialogRequest } from '../model/dialog'
import './PlaylistEditor.css'

interface PlaylistEditorProps {
  request: PlaylistDialogRequest
  pending: boolean
  locked?: boolean
  onSave: (title: string, description: string, ids: string[], noDiscover: boolean, cover: vkPlaylistCover.PlaylistCoverUpload | null, removeCover: boolean) => void
  onCancel: () => void
  onDelete?: () => void
}

const audioId = (track: commonTypes.TrackItem) => track.id + (track.accessKey.length > 0 ? `_${track.accessKey}` : '')

export const PlaylistEditor = ({ request, pending, locked = false, onSave, onCancel, onDelete }: PlaylistEditorProps) => {
  const editing = request.kind === 'edit'
  const [draft, setDraft] = useState<{ title: string, description: string, noDiscover: boolean, ids: string[], tracks: commonTypes.TrackItem[] } | null>(null)
  const [selecting, setSelecting] = useState(false)
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [cover, setCover] = useState<vkPlaylistCover.PlaylistCoverUpload | null>(null)
  const [removeCover, setRemoveCover] = useState(false)
  const [preview, setPreview] = useState('')
  const [coverPending, setCoverPending] = useState(false)
  const [coverError, setCoverError] = useState(false)
  const upload = useRef<AbortController | null>(null)
  useEffect(() => () => { upload.current?.abort() }, [])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  const selectCover = async (file: globalThis.File) => {
    upload.current?.abort()
    const controller = new AbortController()
    upload.current = controller
    setCoverPending(true)
    setCoverError(false)
    try {
      if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Unsupported cover file')
      const image = await createImageBitmap(file)
      const valid = image.width >= 300 && image.height >= 300 && image.width <= 7000 && image.height <= 7000
      image.close()
      if (!valid) throw new Error('Unsupported cover dimensions')
      const result = await vkPlaylistCover.upload(request.userId, file, controller.signal)
      if (controller.signal.aborted) return
      setCover(result)
      setRemoveCover(false)
      setPreview(URL.createObjectURL(file))
    } catch {
      if (!controller.signal.aborted) setCoverError(true)
    } finally {
      if (!controller.signal.aborted) setCoverPending(false)
    }
  }
  const controlsDisabled = pending || locked || coverPending
  const query = useQuery({
    queryKey: ['playlistEditor', request.userId, editing ? request.playlist.id : 'new'],
    queryFn: async ({ signal }) => {
      if (!editing) return { title: '', description: '', noDiscover: false, ids: request.kind === 'create' ? request.audioIds : [audioId(request.track)], tracks: request.kind === 'add' ? [request.track] : request.tracks ?? [] }
      const metadata = await vkPlaylists.getPlaylist(request.userId, request.playlist.id, signal)
      const tracks: commonTypes.TrackItem[] = []
      let offset: number | null = 0
      while (offset != null) {
        const page = await vkPlaylists.getTracks(request.userId, request.playlist.id, offset, signal)
        tracks.push(...page.items)
        offset = page.nextOffset
      }
      if (tracks.length !== metadata.count) throw new Error('Playlist changed while loading')
      return { title: metadata.title, description: metadata.description, noDiscover: metadata.noDiscover ?? false, ids: tracks.map(audioId), tracks }
    },
    enabled: editing,
    initialData: editing ? undefined : { title: '', description: '', noDiscover: false, ids: request.kind === 'create' ? request.audioIds : [audioId(request.track)], tracks: request.kind === 'add' ? [request.track] : request.tracks ?? [] },
    staleTime: 0,
    gcTime: 0,
    retry: false,
    networkMode: 'always',
    refetchOnWindowFocus: false
  })
  const library = useInfiniteQuery({
    queryKey: ['playlistTrackPicker', request.userId],
    initialPageParam: 0,
    queryFn: async ({ pageParam, signal }) => await vkPlaylists.getTracks(request.userId, undefined, pageParam, signal),
    getNextPageParam: page => page.nextOffset,
    enabled: selecting,
    retry: false,
    networkMode: 'always',
    refetchOnWindowFocus: false
  })
  const value = draft ?? query.data
  if (value == null) return <Div>{query.isError ? <><Footnote role='alert'>Не удалось загрузить плейлист целиком</Footnote><Button mode='secondary' onClick={() => { void query.refetch() }}>Повторить</Button></> : <Spinner aria-label='Загрузка плейлиста' />}</Div>
  const change = (patch: Partial<typeof value>) => { setDraft({ ...value, ...patch }) }
  const remove = (id: string) => { change({ ids: value.ids.filter(item => item !== id) }) }
  const move = (index: number, direction: number) => {
    const ids = [...value.ids]
    const target = index + direction
    if (target < 0 || target >= ids.length) return
    const moved = ids[index]
    ids[index] = ids[target]
    ids[target] = moved
    change({ ids })
  }
  const selected = new Map(value.tracks.map(track => [track.id, track]))
  const available = [...new Map(library.data?.pages.flatMap(page => page.items).map(track => [track.id, track]) ?? []).values()]
  const toggleTrack = (track: commonTypes.TrackItem, include: boolean) => {
    const ids = value.ids.filter(id => id !== track.id && !id.startsWith(`${track.id}_`))
    change({
      ids: include ? [...ids, audioId(track)] : ids,
      tracks: [...value.tracks.filter(item => item.id !== track.id), track]
    })
  }
  const normalized = search.trim().toLocaleLowerCase('ru')
  return (
    <form onSubmit={event => { event.preventDefault(); if (!pending && !coverPending && value.title.trim().length > 0) onSave(value.title, value.description, value.ids, value.noDiscover, cover, removeCover) }}>
      <div className='vkap_playlist_editor_intro'>
        <div>
          <FormItem top='Название' htmlFor='playlist-title'><Input id='playlist-title' value={value.title} readOnly={controlsDisabled} onChange={event => { change({ title: event.target.value }) }} /></FormItem>
          <FormItem top='Описание' htmlFor='playlist-description'><Textarea id='playlist-description' value={value.description} readOnly={controlsDisabled} onChange={event => { change({ description: event.target.value }) }} /></FormItem>
          <Checkbox checked={value.noDiscover} disabled={controlsDisabled} onChange={event => { change({ noDiscover: event.target.checked }) }}>Скрыть из поиска и рекомендаций</Checkbox>
        </div>
        <div className='vkap_playlist_editor_cover'>
          <MediaCover images={preview ? [preview] : removeCover ? [] : editing ? request.playlist.covers ?? [] : []} size={120} />
          <File accept='image/jpeg,image/png' disabled={controlsDisabled} loading={coverPending} onChange={event => { const file = event.target.files?.[0]; if (file != null) void selectCover(file); event.target.value = '' }}>Обложка</File>
          {(preview || (editing && !removeCover && request.playlist.covers?.length)) ? <Button mode='tertiary' aria-label='Убрать обложку' disabled={controlsDisabled} onClick={() => { upload.current?.abort(); setCover(null); setPreview(''); setRemoveCover(true); setCoverPending(false) }}>Убрать</Button> : null}
        </div>
      </div>
      {coverError && <Div><Footnote role='alert'>Не удалось загрузить обложку. Выберите JPEG или PNG до 5 МБ, размером от 300 до 7000 пикселей</Footnote></Div>}
      <Header>Треков: {value.ids.length}</Header>
      <List>{value.ids.map((id, index) => {
        const track = selected.get(id.split('_').slice(0, 2).join('_'))
        return (
          <SimpleCell
            Component='div'
            role='listitem'
            key={id}
            before={<MediaCover images={track?.image ? [track.image] : []} size={40} />}
            subtitle={track?.artist}
            after={
              <ButtonGroup gap='s'>
                <IconButton aria-label={`Выше: ${track?.title ?? index + 1}`} disabled={controlsDisabled || index === 0} onClick={() => { move(index, -1) }}><Icon20ChevronUp /></IconButton>
                <IconButton aria-label={`Ниже: ${track?.title ?? index + 1}`} disabled={controlsDisabled || index === value.ids.length - 1} onClick={() => { move(index, 1) }}><Icon24ChevronDown /></IconButton>
                <IconButton aria-label={`Убрать: ${track?.title ?? index + 1}`} disabled={controlsDisabled} onClick={() => { remove(id) }}><Icon20DeleteOutline /></IconButton>
              </ButtonGroup>
            }
          >
            {track?.title ?? 'Недоступная аудиозапись'}
          </SimpleCell>
        )
      })}
      </List>
      <Div><Button mode='secondary' disabled={controlsDisabled} onClick={() => { setSelecting(!selecting) }}>{selecting ? 'Готово' : 'Добавить аудиозаписи'}</Button></Div>
      {selecting && (
        <>
          <Search aria-label='Поиск среди моих треков' value={search} onChange={event => { setSearch(event.target.value) }} />
          {library.isPending && <Div><Spinner aria-label='Загрузка моих треков' /></Div>}
          {available.filter(track => `${track.title} ${track.artist}`.toLocaleLowerCase('ru').includes(normalized)).map(track => <Checkbox key={track.id} checked={value.ids.some(id => id === track.id || id.startsWith(`${track.id}_`))} disabled={controlsDisabled} onChange={event => { toggleTrack(track, event.target.checked) }}>{track.artist} — {track.title}</Checkbox>)}
          {!library.isPending && available.length === 0 && !library.isError && <Div><Footnote>В вашей музыке пока нет треков</Footnote></Div>}
          {library.isError && <Div><Footnote role='alert'>Не удалось загрузить треки</Footnote><Button mode='secondary' onClick={() => { void (library.data == null ? library.refetch() : library.fetchNextPage()) }}>Повторить</Button></Div>}
          {library.hasNextPage && !library.isError && <Div><Button mode='secondary' disabled={library.isFetching} loading={library.isFetchingNextPage} onClick={() => { void library.fetchNextPage() }}>Показать ещё треки</Button></Div>}
        </>
      )}
      {onDelete != null && <Div>{confirmDelete ? <><Footnote>Удалить плейлист из вашей музыки VK?</Footnote><Button appearance='negative' disabled={controlsDisabled} onClick={onDelete}>Да, удалить плейлист</Button></> : <Button mode='tertiary' appearance='negative' disabled={controlsDisabled} onClick={() => { setConfirmDelete(true) }}>Удалить плейлист</Button>}</Div>}
      <Div><ButtonGroup><Button type='submit' disabled={value.title.trim().length === 0 || coverPending} aria-disabled={controlsDisabled || undefined} loading={pending}>{locked ? 'Повторить сохранение обложки' : 'Сохранить'}</Button><Button mode='secondary' onClick={onCancel}>Отмена</Button></ButtonGroup></Div>
    </form>
  )
}

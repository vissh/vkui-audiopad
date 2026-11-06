import { type vkPlaylists } from '@vk-audiopad/common'
import { Icon24PenOutline } from '@vkontakte/icons'
import { Button, Div, Footnote, List, SimpleCell, Skeleton, Spinner, Tappable } from '@vkontakte/vkui'
import { type ReactNode } from 'react'
import { AlbumAuthor, AlbumStats } from '@/entities/album'
import { HorizontalScroll } from '@/shared/ui/horizontal-scroll'
import { MediaCover } from '@/shared/ui/media-cover'
import { TooltipIconButton } from '@/shared/ui/tooltip-icon-button'
import { useOwnedPlaylists } from '../api/playlists'
import { playlistDialogAtom } from '../model/dialog'
import './PlaylistTiles.css'

export const PlaylistList = ({ userId, enabled = true, busy = false, tiles = false, leading, renderAction, onSelect }: { userId: string, enabled?: boolean, busy?: boolean, tiles?: boolean, leading?: ReactNode, renderAction?: (playlist: vkPlaylists.MusicPlaylist) => ReactNode, onSelect: (playlist: vkPlaylists.MusicPlaylist) => void }) => {
  const query = useOwnedPlaylists(userId, enabled, tiles ? 'library' : 'owned')
  const items = [...new Map(query.data?.pages.flatMap(page => page.items).map(item => [`${item.ownerId}_${item.id}`, item]) ?? []).values()]
  return (
    <>
      {query.isPending && !tiles && <Div><Spinner aria-label='Загрузка плейлистов' /></Div>}
      {!query.isPending && items.length === 0 && !query.isError && <Div><Footnote>У вас пока нет плейлистов</Footnote></Div>}
      {tiles
        ? <HorizontalScroll>
            <div className='vkap_playlist_tiles'>
              {leading}
              {query.isPending && Array.from({ length: 4 }, (_, index) => <div key={`skeleton-${index}`} aria-label='Загрузка плейлистов'><Skeleton height={160} /><Skeleton width='80%' height={16} style={{ marginTop: 12 }} /></div>)}
              {items.map(item => (
                <div key={`${item.ownerId}_${item.id}`} className='vkap_playlist_tile_item'>
                  <Tappable Component='button' type='button' className='vkap_playlist_tile' aria-disabled={busy || undefined} onClick={() => { if (!busy) onSelect(item) }}>
                    <span className='vkap_playlist_tile_cover'><MediaCover images={item.covers ?? []} fluid /></span>
                    <span className='vkap_playlist_tile_title'>{item.title}</span>
                    <Footnote Component='span' className='vkap_playlist_tile_count'><AlbumAuthor name={item.authorName ?? ''} avatarUrl={item.authorAvatarUrl} /></Footnote>
                  </Tappable>
                  <div className='vkap_playlist_tile_play'>
                    {renderAction?.(item)}
                    <AlbumStats tracks={item.count} plays={item.plays} />
                    {item.ownerId === userId && item.editable && <TooltipIconButton text='Редактировать плейлист' suppressTooltipOnClick icon={Icon24PenOutline} className='vkap_playlist_edit' onClick={() => { playlistDialogAtom.set({ kind: 'edit', userId, playlist: item }) }} />}
                  </div>
                </div>
              ))}
            </div>
          </HorizontalScroll>
        : <List>{items.map(item => <div role='listitem' key={item.id}><SimpleCell before={<MediaCover images={item.covers ?? []} size={48} />} subtitle={`Треков: ${item.count}`} multiline aria-disabled={busy || undefined} onClick={() => { if (!busy) onSelect(item) }}>{item.title}</SimpleCell></div>)}</List>}
      {query.isError && <Div><Footnote role='status'>Не удалось загрузить плейлисты</Footnote><Button mode='secondary' onClick={() => { void query.refetch() }}>Повторить</Button></Div>}
      {query.hasNextPage && <Div><Button mode='secondary' disabled={busy || query.isFetching} loading={query.isFetchingNextPage} onClick={() => { void query.fetchNextPage() }}>Показать ещё</Button></Div>}
    </>
  )
}

import { type vkPlaylists } from '@vk-audiopad/common'
import { Button, Div, Footnote, HorizontalScroll, List, SimpleCell, Skeleton, Spinner, Tappable } from '@vkontakte/vkui'
import { type ReactNode } from 'react'
import { MediaCover } from '@/shared/ui/media-cover'
import { useOwnedPlaylists } from '../api/playlists'
import './PlaylistTiles.css'

export const PlaylistList = ({ userId, enabled = true, busy = false, tiles = false, leading, onSelect }: { userId: string, enabled?: boolean, busy?: boolean, tiles?: boolean, leading?: ReactNode, onSelect: (playlist: vkPlaylists.MusicPlaylist) => void }) => {
  const query = useOwnedPlaylists(userId, enabled)
  const items = [...new Map(query.data?.pages.flatMap(page => page.items).map(item => [item.id, item]) ?? []).values()]
  return (
    <>
      {query.isPending && !tiles && <Div><Spinner aria-label='Загрузка плейлистов' /></Div>}
      {!query.isPending && items.length === 0 && !query.isError && <Div><Footnote>У вас пока нет своих плейлистов</Footnote></Div>}
      {tiles
        ? <HorizontalScroll>
            <div className='vkap_playlist_tiles'>
              {leading}
              {query.isPending && Array.from({ length: 4 }, (_, index) => <div key={`skeleton-${index}`} aria-label='Загрузка плейлистов'><Skeleton height={160} /><Skeleton width='80%' height={16} style={{ marginTop: 12 }} /></div>)}
              {items.map(item => (
                <Tappable Component='button' type='button' key={item.id} className='vkap_playlist_tile' aria-disabled={busy || undefined} onClick={() => { if (!busy) onSelect(item) }}>
                  <span className='vkap_playlist_tile_cover'><MediaCover images={item.covers ?? []} fluid /></span>
                  <span className='vkap_playlist_tile_title'>{item.title}</span>
                  <Footnote Component='span' className='vkap_playlist_tile_count'>Треков: {item.count}</Footnote>
                </Tappable>
              ))}
            </div>
          </HorizontalScroll>
        : <List>{items.map(item => <SimpleCell key={item.id} before={<MediaCover images={item.covers ?? []} size={48} />} subtitle={`Треков: ${item.count}`} multiline aria-disabled={busy || undefined} onClick={() => { if (!busy) onSelect(item) }}>{item.title}</SimpleCell>)}</List>}
      {query.isError && <Div><Footnote role='status'>Не удалось загрузить плейлисты</Footnote><Button mode='secondary' onClick={() => { void query.refetch() }}>Повторить</Button></Div>}
      {query.hasNextPage && <Div><Button mode='secondary' disabled={busy || query.isFetching} loading={query.isFetchingNextPage} onClick={() => { void query.fetchNextPage() }}>Показать ещё</Button></Div>}
    </>
  )
}

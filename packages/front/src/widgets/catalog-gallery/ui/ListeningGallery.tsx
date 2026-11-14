import { useQuery } from '@tanstack/react-query'
import { commonUtils, type commonTypes } from '@vk-audiopad/common'
import { Icon16User } from '@vkontakte/icons'
import { Avatar, Button, Card, Div, Footnote, Group, Header, Link, SimpleCell, Skeleton, Tappable } from '@vkontakte/vkui'
import { memo, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { FollowIcon } from '@/features/follow-album'
import { playOrPause } from '@/features/play-or-pause'
import { PlayPlaylistButton } from '@/features/play-or-pause-album'
import { useTrackPlayback } from '@/entities/active-track'
import { getTrackState, TrackImage } from '@/entities/track'
import { fetchPlaylist } from '@/shared/api'
import { openAlbumsPage, openPlaylistPage } from '@/shared/model'
import { type Album } from '@/shared/types'
import { HorizontalScroll } from '@/shared/ui/horizontal-scroll'
import './ListeningGallery.css'

interface ListeningGalleryProps {
  userId: string
  title: string
  showAllLink: string
  albums: Album[]
}

const matchPercentage = /^\s*(100|[1-9]?\d)\s*%/

export const ListeningGallery = ({ userId, title, showAllLink, albums }: ListeningGalleryProps) => (
  <Group header={
    <Header after={showAllLink.length > 0 && <Link onClick={() => { openAlbumsPage(title, showAllLink) }}>Показать все</Link>}>
      <span className='vkap_listening_brand'><span className='vkap_listening_logo' aria-hidden='true'>{[4, 8, 12, 18, 10].map(height => <span key={height} style={{ height }} />)}</span>ТОЛЬКО В VK МУЗЫКЕ</span>
    </Header>
  }
  >
    <Header>{title}</Header>
    <HorizontalScroll>
      <div className='vkap_listening_cards'>
        {albums.map(album => <ListeningCard key={`${album.ownerId}_${album.id}`} userId={userId} album={album} />)}
      </div>
    </HorizontalScroll>
  </Group>
)

const ListeningCard = ({ userId, album }: { userId: string, album: Album }) => {
  const { ref, inView } = useInView({ rootMargin: '200px', triggerOnce: true, skip: album.tracks.length > 0, fallbackInView: true })
  const [failedCover, setFailedCover] = useState<string | null>(null)
  const query = useQuery({
    queryKey: ['listeningPreview', userId, album.ownerId, album.id, album.blockId],
    queryFn: async ({ signal }) => await fetchPlaylist({ fromId: userId, playlist: album }, signal),
    enabled: album.tracks.length === 0 && inView,
    retry: false,
    networkMode: 'always',
    refetchOnWindowFocus: false
  })
  const playlist = query.data?.playlist ?? album
  const tracks = playlist.tracks.slice(0, 3)
  const match = [album.infoLine, album.authorLine].map(value => matchPercentage.exec(value)).find(value => value != null)
  const authorName = matchPercentage.test(album.authorName) ? '' : album.authorName
  const hasCover = album.coverUrl.length > 0 && failedCover !== album.coverUrl

  return (
    <Card getRootRef={ref} Component='article' mode='outline-tint' className='vkap_listening_card' aria-label={album.title}>
      <Tappable Component='button' type='button' className={`vkap_listening_cover${hasCover ? ' vkap_listening_cover_with_image' : ''}`} onClick={() => { openPlaylistPage(userId, playlist) }}>
        {hasCover && <img src={album.coverUrl} alt='' loading='lazy' onError={() => { setFailedCover(album.coverUrl) }} />}
        {match != null && <span className='vkap_listening_match'><strong>{match[1]}%</strong> · совпадение с вашим вкусом</span>}
        <span className='vkap_listening_details'>
          <span className='vkap_listening_title'>{album.title}</span>
          {authorName.length > 0 && <span className='vkap_listening_author'><Avatar size={20} src={album.authorAvatarUrl} alt='' fallbackIcon={<Icon16User />} /><span>{authorName}</span></span>}
        </span>
      </Tappable>
      <div className='vkap_listening_actions'><FollowIcon album={album} /><PlayPlaylistButton userId={userId} album={album} /></div>
      <div className='vkap_listening_tracks'>
        {tracks.map(track => <ListeningTrack key={track.id} track={track} playlist={playlist} />)}
        {tracks.length === 0 && query.isPending && <div className='vkap_listening_skeleton' aria-label='Загрузка треков'>{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} height={48} />)}</div>}
        {tracks.length === 0 && query.isError && <Div><Footnote>Треки не загрузились</Footnote><Button mode='tertiary' onClick={() => { void query.refetch() }}>Повторить</Button></Div>}
        {tracks.length === 0 && !query.isPending && !query.isError && <Div><Footnote>В плейлисте пока нет треков</Footnote></Div>}
      </div>
    </Card>
  )
}

const ListeningTrack = memo(function ListeningTrack ({ track, playlist }: { track: commonTypes.TrackItem, playlist: commonTypes.Playlist }) {
  const playback = useTrackPlayback(track.id)
  const state = getTrackState(track, playback == null ? null : track, playback === 'played')
  return (
    <SimpleCell
      Component='button'
      type='button'
      className='vkap_listening_track'
      before={<TrackImage imageSrc={track.image} trackState={state} />}
      subtitle={track.artist}
      after={<Footnote className='vkap_listening_duration'>{commonUtils.toHHMMSS(track.duration)}</Footnote>}
      disabled={state === 'disabled'}
      onClick={() => { playOrPause(state, track.id, playlist) }}
    >
      {track.title}
    </SimpleCell>
  )
})

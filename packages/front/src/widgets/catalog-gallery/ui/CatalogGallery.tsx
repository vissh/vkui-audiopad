import { useQueryClient } from '@tanstack/react-query'
import { commonUtils, vkApiClient, type commonTypes } from '@vk-audiopad/common'
import { Icon28AddOutline, Icon28Done } from '@vkontakte/icons'
import { Card, Group, Header, Image, Tappable } from '@vkontakte/vkui'
import { memo, useState } from 'react'
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { AlbumGallery } from '@/widgets/album-list'
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { BannerGallery } from '@/widgets/banner-gallery'
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { RecommendedGallery } from '@/widgets/recommended-gallery'
// eslint-disable-next-line @conarti/feature-sliced/layers-slices
import { TrackGallery } from '@/widgets/track-list'
import { playOrPause } from '@/features/play-or-pause'
import { PlayMixButton, PlayCatalogButton } from '@/features/play-or-pause-album'
import { useActiveTrack, usePlayed } from '@/entities/active-track'
import { getTrackState } from '@/entities/track'
import { openAlbumsPage, openPlaylistPage, openArtistPage } from '@/shared/model'
import { CatalogBlockDataType, type CatalogBlock } from '@/shared/types'
import { CatalogTiles } from '@/shared/ui/catalog-tiles'
import { ShowAllLink } from '@/shared/ui/show-all-link'
import { AsyncTooltipIconButton } from '@/shared/ui/tooltip-icon-button'
import { ListeningGallery } from './ListeningGallery'
import './RadioStations.css'

interface CatalogGalleryProps {
  expanded?: boolean
  hideTitle?: boolean
  mode: 'plain' | 'card'
  isPending: boolean
  loadingBlock: 'tracks' | 'albums'
  userId: string
  catalogBlock: CatalogBlock | undefined | null
}

export const CatalogGallery = memo(function CatalogGallery ({
  mode,
  expanded = false,
  hideTitle = false,
  isPending,
  loadingBlock,
  userId,
  catalogBlock
}: CatalogGalleryProps) {
  if (isPending || catalogBlock == null) {
    return loadingBlock === 'tracks'
      ? <TrackGallery mode={mode} isPending={isPending} userId={userId} playlist={null} />
      : <AlbumGallery mode={mode} isPending={isPending} title='' userId={userId} albums={undefined} showAllLink={undefined} />
  }

  if (catalogBlock.dataType === CatalogBlockDataType.TRACKS && catalogBlock.playlist.isRadio) return <RadioStations userId={userId} playlist={catalogBlock.playlist} />

  if ('albums' in catalogBlock && catalogBlock.title.trim().toLocaleLowerCase('ru') === 'слушайте друг друга') {
    return <ListeningGallery userId={userId} title={catalogBlock.title} albums={catalogBlock.albums} showAllLink={catalogBlock.showAllLink} />
  }

  switch (catalogBlock.dataType) {
    case CatalogBlockDataType.TRACKS:
      return (
        <TrackGallery
          hideTitle={hideTitle}
          mode={mode}
          isPending={isPending}
          userId={userId}
          playlist={catalogBlock.playlist}
        />
      )
    case CatalogBlockDataType.ALBUMS:
      return (
        <AlbumGallery
          mode={mode}
          isPending={isPending}
          title={catalogBlock.title}
          userId={userId}
          albums={catalogBlock.albums}
          showAllLink={catalogBlock.showAllLink}
        />
      )
    case CatalogBlockDataType.RECOMMENDATIONS:
      return (
        <RecommendedGallery
          isPending={isPending}
          title={catalogBlock.title}
          userId={userId}
          albums={catalogBlock.albums}
        />
      )
    case CatalogBlockDataType.VIBES:
      return (
        <AlbumGallery
          mode={mode}
          isPending={isPending}
          title={catalogBlock.title}
          userId={userId}
          albums={catalogBlock.albums}
          showAllLink={catalogBlock.showAllLink}
        />
      )
    case CatalogBlockDataType.BANNERS:
      return (
        <BannerGallery
          userId={userId}
          albums={catalogBlock.albums}
          title={catalogBlock.title}
        />
      )
    case CatalogBlockDataType.LINKS:
      return (
        <Group mode={mode} header={<ShowAllLink title={catalogBlock.title} showLink={catalogBlock.showAllLink.length > 0} onClick={() => { openAlbumsPage(catalogBlock.title, catalogBlock.showAllLink) }} />}>
          <CatalogTiles expanded={expanded} items={catalogBlock.links} layout={catalogBlock.layout} onSelect={item => { if (item.artist != null) openArtistPage(item.artist); else if (item.playlist != null) openPlaylistPage(userId, item.playlist); else openAlbumsPage(item.title, item.href) }} renderAction={item => item.mixId != null ? <PlayMixButton userId={userId} item={item} /> : catalogBlock.layout === 'categories' ? <PlayCatalogButton userId={userId} item={item} /> : null} />
        </Group>
      )
    default:
      commonUtils.assertUnreachable(catalogBlock)
  }
})

const RadioStations = ({ userId, playlist }: { userId: string, playlist: commonTypes.Playlist }) => {
  const active = useActiveTrack()
  const played = usePlayed()
  return (
    <Group header={<Header>{playlist.title}</Header>}>
      <div className='vkap_radio_grid' role='list' aria-label={playlist.title}>
        {playlist.tracks.map(track => {
          const state = getTrackState(track, active, played)
          return (
            <Card key={track.id} className='vkap_radio_card' mode='outline-tint'>
              <Tappable Component='button' type='button' className='vkap_radio_station' aria-label={`${state === 'played' ? 'Приостановить' : 'Слушать'}: ${track.title}`} style={track.radioBackground == null ? undefined : { background: `linear-gradient(180deg, ${track.radioBackground}66, transparent 70%)` }} onClick={() => { playOrPause(state, track.id, playlist) }}>
                <Image size={72} src={track.image || undefined} alt='' style={{ backgroundColor: '#fff', padding: 10, boxSizing: 'border-box' }} />
                <span>{track.title}</span>
                {state === 'played' && <span className='vkap_radio_playing'>В эфире</span>}
              </Tappable>
              <FollowRadioButton userId={userId} track={track} />
            </Card>
          )
        })}
      </div>
    </Group>
  )
}

const FollowRadioButton = ({ userId, track }: { userId: string, track: commonTypes.TrackItem }) => {
  const client = useQueryClient()
  const [followState, setFollowState] = useState({ source: track.radioFollowed, value: track.radioFollowed ?? false })
  if (followState.source !== track.radioFollowed) setFollowState({ source: track.radioFollowed, value: track.radioFollowed ?? false })
  const followed = followState.value
  return (
    <AsyncTooltipIconButton
      className='vkap_radio_follow'
      text={`${followed ? 'Удалить из моей музыки' : 'Добавить в мою музыку'}: ${track.title}`}
      icon={followed ? Icon28Done : Icon28AddOutline}
      onClick={async () => {
        await vkApiClient.setRadioStationFollowed(userId, track.id.replace(/^radio_/, ''), !followed)
        setFollowState({ source: track.radioFollowed, value: !followed })
        void client.invalidateQueries({ queryKey: ['audioCatalog', userId] })
        void client.invalidateQueries({ queryKey: ['myMusic', userId] })
      }}
      errorMessage='Не удалось подтвердить изменение. Проверьте радиостанции в VK перед повторной попыткой'
    />
  )
}

import { type commonTypes } from '@vk-audiopad/common'
import { Subhead } from '@vkontakte/vkui'
import { type FC } from 'react'
import { getText } from '../../lib/cast-to-types'
import './ArtistTitle.css'

interface ArtistTitleProps {
  track: commonTypes.TrackItem
  onSearch: (artist: string) => void
  onArtist: (artist: commonTypes.TrackArtist) => void
}

export const ArtistTitle: FC<ArtistTitleProps> = ({ track, onSearch, onArtist }) => {
  const searchClick = (artist: string) => {
    return (e: React.MouseEvent) => {
      e.stopPropagation()
      onSearch(artist)
    }
  }

  const openArtistPage = (artist: commonTypes.TrackArtist) => {
    return (e: React.MouseEvent) => {
      e.stopPropagation()
      onArtist(artist)
    }
  }

  const artist = getText(track.artist)

  return (
    <Subhead className='vkap_artists' Component='h5'>
      {track.mainArtists.length > 0
        ? <>
          {groupArtists(track.mainArtists, openArtistPage)}
          {track.featArtists.length > 0 && (
            <>
              &nbsp;feat.&nbsp;
              {groupArtists(track.featArtists, openArtistPage)}
            </>
          )}
        </>
        : <span
          onClick={searchClick(artist)}
          className='vkap_artist'
        >
          {artist}
        </span>
      }
    </Subhead>
  )
}

const groupArtists = (
  artists: commonTypes.TrackArtist[],
  onClick: (artist: commonTypes.TrackArtist) => (e: React.MouseEvent) => void
) => {
  return artists.map((artist, index, arr) => {
    artist.name = getText(artist.name)
    return (
      <>
        <span
          onClick={onClick(artist)}
          className='vkap_artist'
        >
          {artist.name}
        </span>
        {index !== arr.length - 1 ? ', ' : ''}
      </>
    )
  })
}

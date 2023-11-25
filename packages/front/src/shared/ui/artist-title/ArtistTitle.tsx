import { type commonTypes } from '@vk-audiopad/common'
import { Subhead } from '@vkontakte/vkui'
import { type FC } from 'react'
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

  return (
    <Subhead className='vkap_artists'>
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
          onClick={searchClick(track.artist)}
          className='vkap_artist'
        >
          {track.artist}
        </span>
      }
    </Subhead>
  )
}

const groupArtists = (
  artists: commonTypes.TrackArtist[],
  onClick: (artist: commonTypes.TrackArtist) => (e: React.MouseEvent) => void
) => {
  return artists.map((artist, index, arr) => (
    <>
      <span
        onClick={onClick(artist)}
        className='vkap_artist'
      >
        {artist.name}
      </span>
      {index !== arr.length - 1 ? ', ' : ''}
    </>
  ))
}

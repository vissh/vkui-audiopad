import { type commonTypes } from '@vk-audiopad/common'
import { Link, Subhead } from '@vkontakte/vkui'
import { Fragment, type FC } from 'react'
import { getText } from '../../lib/cast-to-types'
import { hasTextSelection } from '../../lib/text-selection'
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
      if (!hasTextSelection(e)) onSearch(artist)
    }
  }

  const openArtistPage = (artist: commonTypes.TrackArtist) => {
    return (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!hasTextSelection(e)) onArtist(artist)
    }
  }

  const artist = getText(track.artist)

  return (
    <Subhead className='vkap_artists' Component='span' onClick={event => { event.stopPropagation() }}>
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
        : <Link
            Component='button' type='button'
            onClick={searchClick(artist)}
            className='vkap_artist'
          >
            {artist}
          </Link>}
    </Subhead>
  )
}

const groupArtists = (
  artists: commonTypes.TrackArtist[],
  onClick: (artist: commonTypes.TrackArtist) => (e: React.MouseEvent) => void
) => {
  return artists.map((artist, index, arr) => {
    return (
      <Fragment key={`${artist.id}-${index}`}>
        <Link
          Component='button' type='button'
          onClick={onClick(artist)}
          className='vkap_artist'
        >
          {getText(artist.name)}
        </Link>
        {index !== arr.length - 1 ? ', ' : ''}
      </Fragment>
    )
  })
}

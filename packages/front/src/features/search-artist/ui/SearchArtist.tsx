import { type commonTypes } from '@vk-audiopad/common'
import { type FC } from 'react'
import { openArtistPage, openSearchPage } from '@/entities/content-tab'
import { ArtistTitle } from '@/shared/ui/artist-title'

interface SearchArtistProps {
  track: commonTypes.TrackItem
}

export const SearchArtist: FC<SearchArtistProps> = ({ track }) => {
  return (
    <ArtistTitle
      track={track}
      onSearch={openSearchPage}
      onArtist={openArtistPage}
    />
  )
}

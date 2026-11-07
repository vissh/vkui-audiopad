import { catalogLink, type commonTypes } from '@vk-audiopad/common'
import { Icon20Pause, Icon20Play } from '@vkontakte/icons'
import { useState } from 'react'
import { useCurrentPlaylist, usePlaybackRequested } from '@/entities/active-track'
import { fetchCatalogSection, fetchPlaylist } from '@/shared/api'
import { samePlaylist } from '@/shared/lib/pagination'
import { CatalogBlockDataType, type CatalogLinkItem } from '@/shared/types'
import { AsyncTooltipIconButton } from '@/shared/ui/tooltip-icon-button'
import { usePlaylistSelection } from '../model/selection'

export const PlayCatalogButton = ({ userId, item }: { userId: string, item: CatalogLinkItem }) => {
  const current = useCurrentPlaylist()
  const requested = usePlaybackRequested()
  const [selection, setSelection] = useState<{ userId: string, href: string, playlist: commonTypes.Playlist } | null>(null)
  const active = selection?.userId === userId && selection.href === item.href && current != null && samePlaylist(current, selection.playlist)
  const pause = active && requested
  const sectionId = catalogLink.sectionIdFromShowAllLink(item.href)
  const play = usePlaylistSelection(item.href, userId, active, async signal => {
    if (sectionId == null) throw new Error('Unsupported catalog destination')
    const page = await fetchCatalogSection(sectionId, '', signal)
    const tracks = page.blocks.find(block => block.dataType === CatalogBlockDataType.TRACKS)
    let playlist = tracks?.playlist
    if (playlist == null) {
      const albums = page.blocks.find(block => 'albums' in block && block.albums.length > 0)
      if (albums == null || !('albums' in albums)) throw new Error('Empty catalog')
      playlist = (await fetchPlaylist({ fromId: userId, playlist: albums.albums[0] }, signal)).playlist
    }
    if (!signal.aborted) setSelection({ userId, href: item.href, playlist })
    return playlist
  })

  if (sectionId == null) return null
  return <AsyncTooltipIconButton className='vkap_catalog_tile_play' text={`${pause ? 'Приостановить' : 'Воспроизвести'}: ${item.title}`} icon={pause ? Icon20Pause : Icon20Play} tooltipShown={false} onClick={play} errorMessage='Не удалось запустить подборку. Повторите попытку' />
}

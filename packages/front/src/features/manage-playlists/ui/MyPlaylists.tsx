import { vkPlaylists } from '@vk-audiopad/common'
import { Group, Header, Link } from '@vkontakte/vkui'
import { type ReactNode } from 'react'
import { openAlbumsPage, openPlaylistPage } from '@/shared/model'
import { CreatePlaylistButton } from './PlaylistButtons'
import { PlaylistList } from './PlaylistList'

export const MyPlaylists = ({ userId, active, showAllLink = '', renderAction }: { userId: string, active: boolean, showAllLink?: string, renderAction?: (playlist: vkPlaylists.MusicPlaylist) => ReactNode }) => (
  <Group header={<Header after={showAllLink.length > 0 && <Link onClick={() => { openAlbumsPage('Плейлисты', showAllLink) }}>Показать все</Link>}>Плейлисты</Header>}>
    <PlaylistList userId={userId} enabled={active} tiles renderAction={renderAction} leading={<CreatePlaylistButton tile />} onSelect={playlist => { openPlaylistPage(userId, vkPlaylists.toPlaybackPlaylist(playlist)) }} />
  </Group>
)

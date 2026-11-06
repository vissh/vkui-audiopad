import { vkPlaylists } from '@vk-audiopad/common'
import { Group, Header } from '@vkontakte/vkui'
import { openPlaylistPage } from '@/shared/model'
import { CreatePlaylistButton } from './PlaylistButtons'
import { PlaylistList } from './PlaylistList'

export const MyPlaylists = ({ userId, active }: { userId: string, active: boolean }) => (
  <Group header={<Header>Мои плейлисты</Header>}>
    <PlaylistList userId={userId} enabled={active} tiles leading={<CreatePlaylistButton tile />} onSelect={playlist => { openPlaylistPage(userId, vkPlaylists.toPlaybackPlaylist(playlist)) }} />
  </Group>
)

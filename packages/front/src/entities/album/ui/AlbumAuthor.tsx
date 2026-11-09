import { Avatar } from '@vkontakte/vkui'
import './AlbumCell.css'

export const AlbumAuthor = ({ name, avatarUrl }: { name: string, avatarUrl?: string }) => (
  <span className='vkap_album_author'>
    {avatarUrl && <Avatar size={16} src={avatarUrl} alt='' />}
    <span>{name}</span>
  </span>
)

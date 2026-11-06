import { Icon24PlaylistOutline, Icon36PlaylistOutline } from '@vkontakte/icons'
import { GridAvatar, Image } from '@vkontakte/vkui'
import { type ReactNode } from 'react'
import './MediaCover.css'

export const MediaCover = ({ images, size = 128, fluid = false, children }: { images: string[], size?: number, fluid?: boolean, children?: ReactNode }) => {
  const dimensions = fluid ? { widthSize: '100%', heightSize: '100%' } : {}
  return images.length > 1
    ? <GridAvatar {...dimensions} className='vkap_media_collage' src={images.slice(0, 4)} size={size} style={{ borderRadius: 10, overflow: 'hidden' }}>{children}</GridAvatar>
    : <Image {...dimensions} src={images[0]} size={size} loading='lazy' alt='' fallbackIcon={size <= 48 ? <Icon24PlaylistOutline /> : <Icon36PlaylistOutline />}>{children}</Image>
}

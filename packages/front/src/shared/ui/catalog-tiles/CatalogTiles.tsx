import { Icon28MusicOutline, Icon28UserOutline } from '@vkontakte/icons'
import { Avatar, SimpleCell, Tappable } from '@vkontakte/vkui'
import { type ReactNode } from 'react'
import { type CatalogLinkItem } from '../../types'
import { HorizontalScroll } from '../horizontal-scroll'
import './CatalogTiles.css'

export const CatalogTiles = ({ items, layout, onSelect, renderAction, expanded = false }: { items: CatalogLinkItem[], expanded?: boolean, layout: 'categories' | 'banners' | 'friends' | 'mixes' | 'artists', onSelect: (item: CatalogLinkItem) => void, renderAction?: (item: CatalogLinkItem) => ReactNode }) => {
  if (layout === 'friends' || layout === 'artists') {
    const people = items.map(item => (
      <SimpleCell
        key={item.id}
        className={`vkap_person_cell${layout === 'friends' ? ' vkap_friend_cell' : ''}`}
        before={<Avatar size={48} src={item.image || undefined} alt='' fallbackIcon={<Icon28UserOutline />} />}
        subtitle={item.subtitle}
        onClick={() => { onSelect(item) }}
      >
        {item.title}
      </SimpleCell>
    ))
    return expanded
      ? <div className='vkap_friend_grid'>{people}</div>
      : <HorizontalScroll><div className={layout === 'friends' ? 'vkap_friend_rail' : 'vkap_artist_rail'}>{people}</div></HorizontalScroll>
  }
  if (layout === 'banners') {
    return (
      <HorizontalScroll>
        <div className='vkap_catalog_tiles vkap_catalog_tiles_banners'>
          {items.map(item => (
            <Tappable key={item.id} Component='button' type='button' className='vkap_catalog_banner' onClick={() => { onSelect(item) }}>
              {item.image ? <img src={item.image} alt='' loading='lazy' /> : <span className='vkap_catalog_banner_placeholder'><Icon28MusicOutline /></span>}
              <span className='vkap_catalog_banner_label'>{item.title}{item.subtitle && <small>{item.subtitle}</small>}</span>
            </Tappable>
          ))}
        </div>
      </HorizontalScroll>
    )
  }
  return (
    <HorizontalScroll>
      <div className={`vkap_catalog_tiles vkap_catalog_tiles_${layout}`}>
        {items.map(item => (
          <div key={item.id} className={`vkap_catalog_tile ${item.foreground && layout !== 'mixes' ? 'vkap_catalog_tile_foreground' : ''}`} style={item.colors.length > 0 ? { background: item.colors.length > 1 ? `linear-gradient(135deg, ${item.colors.join(', ')})` : item.colors[0] } : undefined}>
            {item.image.length > 0 ? <img src={item.image} alt='' loading='lazy' onError={event => { event.currentTarget.hidden = true }} /> : <Icon28MusicOutline className='vkap_catalog_tile_icon' />}
            {layout === 'mixes' && item.foregroundImage && <Avatar size={137} src={item.foregroundImage} alt='' className='vkap_catalog_mix_avatar' />}
            <span className='vkap_catalog_tile_shade' />
            {item.mixId != null
              ? renderAction?.(item)
              : <Tappable
                  Component='button'
                  type='button'
                  className='vkap_catalog_tile_open'
                  onClick={() => { onSelect(item) }}
                >
                  <span className='vkap_catalog_tile_label'><span>{item.title}</span>{item.subtitle.length > 0 && <small>{item.subtitle}</small>}</span>
                </Tappable>}
            {item.mixId == null && renderAction?.(item)}
          </div>
        ))}
      </div>
    </HorizontalScroll>
  )
}

import { Icon28MusicOutline } from '@vkontakte/icons'
import { HorizontalScroll, Tappable } from '@vkontakte/vkui'
import { type ReactNode } from 'react'
import { type CatalogLinkItem } from '../../types'
import './CatalogTiles.css'

export const CatalogTiles = ({ items, layout, onSelect, renderAction }: { items: CatalogLinkItem[], layout: 'categories' | 'banners', onSelect: (item: CatalogLinkItem) => void, renderAction?: (item: CatalogLinkItem) => ReactNode }) => (
  <HorizontalScroll>
    <div className={`vkap_catalog_tiles vkap_catalog_tiles_${layout}`}>
      {items.map(item => (
        <div key={item.id} className={`vkap_catalog_tile ${item.foreground ? 'vkap_catalog_tile_foreground' : ''}`} style={item.colors.length > 0 ? { background: item.colors.length > 1 ? `linear-gradient(135deg, ${item.colors.join(', ')})` : item.colors[0] } : undefined}>
          {item.image.length > 0 ? <img src={item.image} alt='' loading='lazy' onError={event => { event.currentTarget.hidden = true }} /> : <Icon28MusicOutline className='vkap_catalog_tile_icon' />}
          <span className='vkap_catalog_tile_shade' />
          <Tappable
            Component='button'
            type='button'
            className='vkap_catalog_tile_open'
            onClick={() => { onSelect(item) }}
          >
            <span className='vkap_catalog_tile_label'><span>{item.title}</span>{item.subtitle.length > 0 && <small>{item.subtitle}</small>}</span>
          </Tappable>
          {renderAction?.(item)}
        </div>
      ))}
    </div>
  </HorizontalScroll>
)

import { catalogImages, catalogLink, commonTypes, converter, vkApiClient } from '@vk-audiopad/common'
import { CatalogBlockDataType, type Album, type CatalogBlock, type CatalogLinkItem } from '../types'

type Data = Record<string, unknown>
const object = (value: unknown): value is Data => typeof value === 'object' && value != null && !Array.isArray(value)
const text = (value: unknown): string => typeof value === 'string' ? value : ''
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : []
const id = (value: unknown): string => typeof value === 'number' && Number.isSafeInteger(value) ? String(value) : text(value)
const key = (value: Data): string => `${id(value.owner_id)}_${id(value.id)}`
const records = (value: unknown): Data[] => list(value).filter(object)

export interface TokenCatalogPage {
  sectionId: string
  nextFrom: string
  blocks: CatalogBlock[]
}

export const catalogDestination = (value: unknown): string => {
  try {
    const url = new URL(text(value), 'https://vk.ru')
    if (url.protocol !== 'https:' || !['vk.ru', 'vk.com'].includes(url.hostname)) return ''
    const href = `https://vk.ru${url.pathname}${url.search}`
    return catalogLink.sectionIdFromShowAllLink(href) != null || catalogLink.parseAudioSectionShowAllLink(href) != null ? href : ''
  } catch { return '' }
}

const actionDestination = (value: Data): string => {
  const action = object(value.action) ? value.action : {}
  if (action.type === 'open_section' && /^[\w-]+$/.test(text(value.section_id))) return `/music/catalog/${text(value.section_id)}`
  return action.type === 'open_url' ? catalogDestination(value.url ?? action.url) : ''
}

const linkItem = (value: Data, fallbackId: string): CatalogLinkItem | null => {
  const href = object(value.action) ? actionDestination(value) : catalogDestination(value.url)
  if (href.length === 0 || text(value.title).length === 0) return null
  const background = object(value.background) ? value.background : {}
  return {
    id: id(value.id) || fallbackId,
    title: text(value.title),
    subtitle: text(value.subtitle ?? value.description),
    href,
    image: catalogImages.bestImage(value.image) || catalogImages.bestImage(value.images) || catalogImages.bestImage(value.foreground_images),
    colors: list(background.colors).filter((color): color is string => typeof color === 'string' && /^#(?:[a-f\d]{3}|[a-f\d]{6}|[a-f\d]{8})$/i.test(color)).slice(0, 4),
    foreground: value.image_style === 'contain' || value.image_style === 'foreground' || list(value.foreground_images).length > 0
  }
}

const album = (value: Data, profiles: Map<string, Data>, audios: Map<string, commonTypes.TrackItem | null>): Album | null => {
  const ownerId = id(value.owner_id)
  const playlistId = id(value.id)
  if (!/^-?[1-9]\d*$/.test(ownerId) || !/^-?[1-9]\d*$/.test(playlistId) || text(value.title).length === 0) return null
  const covers = catalogImages.playlistCovers(value)
  const artists = records(value.main_artists).map(artist => text(artist.name)).filter(Boolean).join(', ')
  const profile = profiles.get(ownerId)
  const author = profile == null ? '' : [text(profile.first_name), text(profile.last_name)].filter(Boolean).join(' ')
  const tracks = list(value.audios_ids).map(audioId => audios.get(id(audioId))).filter((value): value is commonTypes.TrackItem => value != null)
  return {
    id: playlistId,
    ownerId,
    blockId: '',
    title: text(value.title),
    tracks,
    isRadio: false,
    isVkMix: false,
    accessHash: text(value.access_key),
    nextOffset: '',
    hasMore: false,
    followHash: '',
    isFollowed: value.is_following === true,
    coverUrl: covers[0] ?? '',
    gridCoverUrls: covers,
    authorLine: artists || text(value.subtitle),
    authorName: author || artists || text(value.subtitle),
    authorAvatarUrl: profile == null ? '' : catalogImages.imageUrl(profile.photo_100) || catalogImages.imageUrl(profile.photo_50),
    infoLine: /^\s*(100|[1-9]?\d)\s*%/.test(text(value.description)) ? text(value.description) : ''
  }
}

const track = (value: Data): commonTypes.TrackItem | null => {
  if (!/^-?[1-9]\d*_[1-9]\d*$/.test(key(value))) return null
  const raw = {
    id: Number(value.id),
    owner_id: Number(value.owner_id),
    artist: text(value.artist),
    title: text(value.title),
    duration: typeof value.duration === 'number' ? value.duration : 0,
    has_lyrics: value.has_lyrics === true,
    access_key: text(value.access_key),
    url: text(value.url),
    track_code: text(value.track_code),
    thumb: { photo_68: catalogImages.bestImage(value.thumb) },
    main_artists: records(value.main_artists).map(artist => ({ id: id(artist.id), name: text(artist.name) })),
    featured_artists: records(value.featured_artists).map(artist => ({ id: id(artist.id), name: text(artist.name) }))
  }
  try { return converter.toTrackItemFromAPIResponse({ response: [raw] }) } catch { return null }
}

export const parseTokenCatalog = (envelope: commonTypes.JSONObject): TokenCatalogPage => {
  if (!object(envelope.response)) throw new vkApiClient.VKApiError('format')
  const payload = envelope.response
  const catalog = object(payload.catalog) ? payload.catalog : {}
  const sections = records(catalog.sections)
  const section = object(payload.section) ? payload.section : sections.find(value => value.id === catalog.default_section) ?? sections[0]
  if (section == null || text(section.id).length === 0) throw new vkApiClient.VKApiError('format')
  const audios = new Map(records(payload.audios).map(value => [key(value), track(value)]))
  const profiles = new Map(records(payload.profiles).map(value => [id(value.id), value]))
  const albums = new Map(records(payload.playlists).map(value => [key(value), album(value, profiles, audios)]))
  const links = new Map(records(payload.links).map(value => [id(value.id), value]))
  const banners = new Map(records(payload.catalog_banners).map(value => [id(value.id), value]))
  const blocks: CatalogBlock[] = []
  let heading = ''
  for (const block of records(section.blocks)) {
    const layout = object(block.layout) ? block.layout : {}
    const title = text(block.title) || text(layout.title) || heading
    const blockId = text(block.id)
    if (block.data_type === 'none') {
      if (title.length > 0) heading = title
      continue
    }
    heading = ''
    if (blockId.length === 0) continue
    const meta = object(block.meta) ? block.meta : {}
    const showAll = object(meta.show_all_info) ? meta.show_all_info : {}
    const showAllLink = text(showAll.section_id).length > 0 ? `/music/catalog/${text(showAll.section_id)}` : catalogDestination(block.url)
    if (block.data_type === 'links' || block.data_type === 'action' || block.data_type === 'catalog_banners') {
      const items = block.data_type === 'links'
        ? list(block.links_ids).map(linkId => links.get(id(linkId))).filter(object)
        : block.data_type === 'action' ? records(block.actions) : list(block.catalog_banner_ids).map(bannerId => banners.get(id(bannerId))).filter(object).map(value => ({ ...value, ...(records(value.buttons)[0] ?? {}), image: value.images ?? value.image }))
      const cards = items.map((value, index) => linkItem(value, `${blockId}-${index}`)).filter((value): value is CatalogLinkItem => value != null)
      if (cards.length > 0) blocks.push({ blockId, title, dataType: CatalogBlockDataType.LINKS, links: cards, showAllLink, layout: ['large_slider', 'promo_banners_slider', 'banner'].includes(text(layout.name)) ? 'banners' : 'categories' })
    } else if (block.data_type === 'music_playlists' || block.data_type === 'music_recommended_playlists') {
      const items = list(block.playlists_ids).map(playlistId => albums.get(id(playlistId))).filter((value): value is Album => value != null)
      if (items.length > 0) blocks.push({ blockId, title, dataType: text(layout.name) === 'music_exclusive_slider' ? CatalogBlockDataType.BANNERS : CatalogBlockDataType.ALBUMS, albums: items, showAllLink })
    } else if (block.data_type === 'music_audios') {
      const items = list(block.audios_ids).map(audioId => audios.get(id(audioId))).filter((value): value is commonTypes.TrackItem => value != null)
      if (items.length > 0) blocks.push({ blockId, dataType: CatalogBlockDataType.TRACKS, playlist: { id: blockId, blockId, title, ownerId: id(layout.owner_id), tracks: items, isRadio: false, isVkMix: false, accessHash: '', nextOffset: '', hasMore: false, followHash: '', isFollowed: false } })
    }
  }
  return { sectionId: text(section.id), nextFrom: text(section.next_from), blocks }
}

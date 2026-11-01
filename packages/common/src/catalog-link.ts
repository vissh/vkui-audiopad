const catalogPathPrefix = '/music/catalog/'
const artistPathRegex = /^\/artist\/([\w-]+)(\/[\w-]+)?$/
const audiosPathRegex = /^\/audios\d+$/
const tokenCharsetRegex = /^[\w-]+$/

export interface ArtistShowAllLink {
  artistId: string
  url: string
}

// Artist page "show all" links (/artist/<id>/releases, /artist/<id>/featuring_releases)
// carry no section token: the section id must be resolved via catalog.getAudioArtist
// with the page url as a parameter.
export const parseArtistShowAllLink = (showAllLink: string): ArtistShowAllLink | null => {
  if (showAllLink.length === 0) {
    return null
  }

  let url: URL
  try {
    url = new URL(showAllLink, 'https://vk.ru')
  } catch {
    return null
  }

  const match = artistPathRegex.exec(url.pathname)
  if (match == null) {
    return null
  }

  return {
    artistId: match[1],
    url: `https://vk.ru${url.pathname}`
  }
}

export interface AudioSectionShowAllLink {
  url: string
}

// General/explore/my-music tabs "show all" links point to a page block
// (/audios<ownerId>?section=<name>&block=<block>) — no token either.
// The section id is resolved via catalog.getAudio with the page url.
export const parseAudioSectionShowAllLink = (showAllLink: string): AudioSectionShowAllLink | null => {
  if (showAllLink.length === 0) {
    return null
  }

  let url: URL
  try {
    url = new URL(showAllLink, 'https://vk.ru')
  } catch {
    return null
  }

  const block = url.searchParams.get('block')
  if (!audiosPathRegex.test(url.pathname) || block == null || block.length === 0) {
    return null
  }

  return { url: `https://vk.ru${url.pathname}?section=${url.searchParams.get('section') ?? ''}&block=${block}` }
}

// vk.ru catalog "show all" links carry an opaque section id:
// either as a `type` query param (/audio?section=recoms_block&type=<id>)
// or as a path segment (/music/catalog/<id>). The id works directly
// as section_id in al_audio.php?act=load_catalog_section.
export const sectionIdFromShowAllLink = (showAllLink: string): string | null => {
  if (showAllLink.length === 0) {
    return null
  }

  let url: URL
  try {
    url = new URL(showAllLink, 'https://vk.ru')
  } catch {
    return null
  }

  const fromQuery = url.searchParams.get('type')
  if (fromQuery != null && tokenCharsetRegex.test(fromQuery)) {
    return fromQuery
  }

  if (url.pathname.startsWith(catalogPathPrefix)) {
    const token = url.pathname.substring(catalogPathPrefix.length).replace(/\/+$/, '')
    if (tokenCharsetRegex.test(token)) {
      return token
    }
  }

  return null
}

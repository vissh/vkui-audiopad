import { describe, expect, it } from 'vitest'
import { parseArtistShowAllLink, parseAudioSectionShowAllLink, sectionIdFromShowAllLink } from './catalog-link'

describe('parseAudioSectionShowAllLink', () => {
  it('parses explore block link', () => {
    expect(parseAudioSectionShowAllLink('/audios8902548?section=explore&block=editors_choice')).toEqual({
      url: 'https://vk.ru/audios8902548?section=explore&block=editors_choice'
    })
  })

  it('parses absolute block link', () => {
    expect(parseAudioSectionShowAllLink('https://vk.ru/audios8902548?section=explore&block=stay_on_trend')).toEqual({
      url: 'https://vk.ru/audios8902548?section=explore&block=stay_on_trend'
    })
  })

  it('parses my-music block link', () => {
    expect(parseAudioSectionShowAllLink('/audios8902548?section=all&block=new_songs')).toEqual({
      url: 'https://vk.ru/audios8902548?section=all&block=new_songs'
    })
  })

  it('returns null without block param', () => {
    expect(parseAudioSectionShowAllLink('/audios8902548?section=explore')).toBeNull()
  })

  it('returns null for token links', () => {
    expect(parseAudioSectionShowAllLink('/audio?section=recoms_block&type=abc')).toBeNull()
  })

  it('returns null for empty link', () => {
    expect(parseAudioSectionShowAllLink('')).toBeNull()
  })
})

describe('parseArtistShowAllLink', () => {
  it('parses artist releases link', () => {
    expect(parseArtistShowAllLink('/artist/fever333/releases')).toEqual({
      artistId: 'fever333',
      url: 'https://vk.ru/artist/fever333/releases'
    })
  })

  it('parses artist featuring releases link', () => {
    expect(parseArtistShowAllLink('/artist/fever333/featuring_releases')).toEqual({
      artistId: 'fever333',
      url: 'https://vk.ru/artist/fever333/featuring_releases'
    })
  })

  it('parses numeric artist id with subpage', () => {
    expect(parseArtistShowAllLink('/artist/6080837945729599586/top_audios')).toEqual({
      artistId: '6080837945729599586',
      url: 'https://vk.ru/artist/6080837945729599586/top_audios'
    })
  })

  it('parses artist page without subpage', () => {
    expect(parseArtistShowAllLink('/artist/queen')).toEqual({
      artistId: 'queen',
      url: 'https://vk.ru/artist/queen'
    })
  })

  it('handles absolute urls', () => {
    expect(parseArtistShowAllLink('https://vk.ru/artist/queen/releases')).toEqual({
      artistId: 'queen',
      url: 'https://vk.ru/artist/queen/releases'
    })
  })

  it('returns null for token links', () => {
    expect(parseArtistShowAllLink('/audio?section=recoms_block&type=abc')).toBeNull()
  })

  it('returns null for album links', () => {
    expect(parseArtistShowAllLink('/music/album/123_456')).toBeNull()
  })

  it('returns null for empty artist id', () => {
    expect(parseArtistShowAllLink('/artist/')).toBeNull()
    expect(parseArtistShowAllLink('/artist')).toBeNull()
    expect(parseArtistShowAllLink('')).toBeNull()
  })
})

describe('sectionIdFromShowAllLink', () => {
  it('extracts section id from type query param (current vk.ru format)', () => {
    const link = '/audio?section=recoms_block&type=PUlQVA8GR0R3W0tMF2tYVmRHS04XDlNfdllcQg0YSVFkUUsHQFEOCGRHS0UMFlFTd1NbQgUCXlF0W19OBwFeX35cRVQ'
    expect(sectionIdFromShowAllLink(link)).toBe('PUlQVA8GR0R3W0tMF2tYVmRHS04XDlNfdllcQg0YSVFkUUsHQFEOCGRHS0UMFlFTd1NbQgUCXlF0W19OBwFeX35cRVQ')
  })

  it('extracts section id from /music/catalog/ path', () => {
    const link = '/music/catalog/PUlQVA8GR0R3W0tMF2tZX2RHS04XDlNfdllcQg0YSVFkUUsHQFEOCGRHS0UMFlFTd1NbQgUCXlF0W19OBwFeX35cRVQ'
    expect(sectionIdFromShowAllLink(link)).toBe('PUlQVA8GR0R3W0tMF2tZX2RHS04XDlNfdllcQg0YSVFkUUsHQFEOCGRHS0UMFlFTd1NbQgUCXlF0W19OBwFeX35cRVQ')
  })

  it('handles absolute urls', () => {
    const link = 'https://vk.ru/audio?section=recoms_block&type=abc_def-123'
    expect(sectionIdFromShowAllLink(link)).toBe('abc_def-123')
  })

  it('returns null when type param is missing', () => {
    expect(sectionIdFromShowAllLink('/audio?section=recoms_block')).toBeNull()
  })

  it('returns null when type param is empty', () => {
    expect(sectionIdFromShowAllLink('/audio?section=recoms_block&type=')).toBeNull()
  })

  it('returns null for album links', () => {
    expect(sectionIdFromShowAllLink('/music/album/123_456_hash')).toBeNull()
  })

  it('returns null for empty link', () => {
    expect(sectionIdFromShowAllLink('')).toBeNull()
  })
})

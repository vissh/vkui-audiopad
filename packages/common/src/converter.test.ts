import { describe, expect, it } from 'vitest'
import { AudioTupleIndex, type JSONValue, TrackFlagBit } from './types'
import { decode, toTrackItem, toTrackItemFromAPIResponse, toTracksItems } from './converter'

const createTrackTuple = (): JSONValue[] => {
  const tuple: JSONValue[] = []
  tuple[AudioTupleIndex.ID] = '123'
  tuple[AudioTupleIndex.OWNER_ID] = '456'
  tuple[AudioTupleIndex.URL] = 'https://audio.vk.ru/track.mp3'
  tuple[AudioTupleIndex.TITLE] = 'Track <b>title</b>'
  tuple[AudioTupleIndex.PERFORMER] = 'The <b>Artist</b>'
  tuple[AudioTupleIndex.DURATION] = 187
  tuple[AudioTupleIndex.FLAGS] = 5
  tuple[AudioTupleIndex.CONTEXT] = 'search_context'
  tuple[AudioTupleIndex.HASHES] = 'addHash/editHash/actionHash/deleteHash/replaceHash/urlHash/restoreHash'
  tuple[AudioTupleIndex.COVER_URL] = 'https://cdn.vk.ru/cover.jpg,https://cdn.vk.ru/cover@2x.jpg'
  tuple[AudioTupleIndex.MAIN_ARTISTS] = [{ id: '1', name: 'The <b>Artist</b>' }]
  tuple[AudioTupleIndex.FEAT_ARTISTS] = [{ id: '2', name: 'Feat Artist' }]
  tuple[AudioTupleIndex.TRACK_CODE] = 'track_code'
  tuple[AudioTupleIndex.ACCESS_KEY] = 'access_key'
  return tuple
}

describe('decode', () => {
  it('removes html tags', () => {
    expect(decode('Track <b>title</b>')).toBe('Track title')
  })

  it('keeps plain text as is', () => {
    expect(decode('plain text')).toBe('plain text')
  })
})

describe('toTrackItem', () => {
  it('converts vk.ru audio tuple to TrackItem', () => {
    const track = toTrackItem(createTrackTuple())

    expect(track.id).toBe('456_123')
    expect(track.fromAct).toBe(true)
    expect(track.title).toBe('Track title')
    expect(track.artist).toBe('The Artist')
    expect(track.duration).toBe(187)
    expect(track.flags).toBe(5)
    expect(track.context).toBe('search_context')
    expect(track.accessKey).toBe('access_key')
    expect(track.trackCode).toBe('track_code')
    expect(track.image).toBe('https://cdn.vk.ru/cover.jpg')
    expect(track.url).toBe('')
  })

  it('takes url from tuple only for radio playlists', () => {
    const radioTrack = toTrackItem(createTrackTuple(), true)
    expect(radioTrack.url).toBe('https://audio.vk.ru/track.mp3')
  })

  it('splits hashes string into fields', () => {
    const track = toTrackItem(createTrackTuple())

    expect(track.addHash).toBe('addHash')
    expect(track.editHash).toBe('editHash')
    expect(track.actionHash).toBe('actionHash')
    expect(track.deleteHash).toBe('deleteHash')
    expect(track.replaceHash).toBe('replaceHash')
    expect(track.urlHash).toBe('urlHash')
    expect(track.restoreHash).toBe('restoreHash')
  })

  it('decodes artist names', () => {
    const track = toTrackItem(createTrackTuple())

    expect(track.mainArtists).toEqual([{ id: '1', name: 'The Artist' }])
    expect(track.featArtists).toEqual([{ id: '2', name: 'Feat Artist' }])
  })
})

describe('toTracksItems', () => {
  it('converts playlist with list of tuples', () => {
    const playlist = {
      type: 'radio',
      list: [createTrackTuple(), createTrackTuple()]
    }

    const tracks = toTracksItems(playlist)

    expect(tracks).toHaveLength(2)
    expect(tracks[0]?.id).toBe('456_123')
    expect(tracks[0]?.url).toBe('https://audio.vk.ru/track.mp3')
  })

  it('throws on invalid list', () => {
    expect(() => toTracksItems({ type: 'radio', list: 'not-an-array' })).toThrow('toTracksItems')
  })
})

describe('toTrackItemFromAPIResponse', () => {
  it('converts api.vk.ru response to TrackItem', () => {
    const track = toTrackItemFromAPIResponse({
      response: [{
        owner_id: 1,
        id: 2,
        access_key: 'ak',
        url: 'https://audio.vk.ru/api-track.mp3',
        thumb: { photo_68: 'https://cdn.vk.ru/thumb.jpg' },
        artist: 'API Artist',
        main_artists: [{ id: '3', name: 'API Artist' }],
        featured_artists: [],
        title: 'API title',
        duration: 42,
        track_code: 'api_track_code'
      }]
    })

    expect(track.id).toBe('1_2')
    expect(track.fromAct).toBe(false)
    expect(track.accessKey).toBe('ak')
    expect(track.url).toBe('https://audio.vk.ru/api-track.mp3')
    expect(track.image).toBe('https://cdn.vk.ru/thumb.jpg')
    expect(track.mainArtists).toEqual([{ id: '3', name: 'API Artist' }])
    expect(track.duration).toBe(42)
    expect(track.flags).toBe(TrackFlagBit.CAN_ADD)
    expect(track.trackCode).toBe('api_track_code')
  })
})

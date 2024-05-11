import {
  castToArray,
  castToJSONObject,
  castToString,
  safeCastToArray,
  safeCastToNumber,
  safeCastToString
} from './cast'
import {
  AudioTupleIndex,
  type JSONObject,
  type JSONValue,
  type TrackArtist,
  type TrackItem
} from './types'

export const toTracksItems = (playlist: JSONObject): TrackItem[] => {
  const isRadio = playlist.type === 'radio'

  if (!Array.isArray(playlist.list)) {
    throw new Error(`toTracksItems: Unexpected type ${typeof playlist.list}`)
  }

  return playlist.list.map((trackInfo: JSONValue) => {
    return toTrackItem(castToArray(trackInfo), isRadio)
  })
}

export const toTrackItem = (trackInfo: JSONValue[], isRadio: boolean = false): TrackItem => {
  const hashes = castToString(trackInfo[AudioTupleIndex.HASHES])
  const [addHash, editHash, actionHash, deleteHash, replaceHash, urlHash, restoreHash] = hashes.split('/')
  const mainArtists = safeCastToArray(trackInfo[AudioTupleIndex.MAIN_ARTISTS])
  const featArtists = safeCastToArray(trackInfo[AudioTupleIndex.FEAT_ARTISTS])

  return {
    id: safeCastToString(trackInfo[AudioTupleIndex.OWNER_ID]) + '_' + safeCastToString(trackInfo[AudioTupleIndex.ID]),
    accessKey: safeCastToString(trackInfo[AudioTupleIndex.ACCESS_KEY]),
    url: isRadio ? safeCastToString(trackInfo[AudioTupleIndex.URL]) : '',
    image: safeCastToString(trackInfo[AudioTupleIndex.COVER_URL]).split(',https://')[0],
    artist: decode(safeCastToString(trackInfo[AudioTupleIndex.PERFORMER])),
    mainArtists: mainArtists.map(decodeArtist),
    featArtists: featArtists.map(decodeArtist),
    title: decode(safeCastToString(trackInfo[AudioTupleIndex.TITLE])),
    duration: safeCastToNumber(trackInfo[AudioTupleIndex.DURATION]),
    context: safeCastToString(trackInfo[AudioTupleIndex.CONTEXT]),
    flags: safeCastToNumber(trackInfo[AudioTupleIndex.FLAGS]),
    trackCode: safeCastToString(trackInfo[AudioTupleIndex.TRACK_CODE]),
    addHash,
    editHash,
    actionHash,
    deleteHash,
    replaceHash,
    urlHash,
    restoreHash
  }
}

export const decode = (value: string): string => {
  return value.replace(/<\s*[^>]*>/gi, '')
}

const decodeArtist = (rawArtist: JSONValue): TrackArtist => {
  const artist = castToJSONObject(rawArtist)
  return {
    id: safeCastToString(artist.id),
    name: decode(safeCastToString(artist.name))
  }
}

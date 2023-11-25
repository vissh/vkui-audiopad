import { type ErrorObject } from 'serialize-error'

export type JSONValue = null | number | string | boolean | { [x: string]: JSONValue } | JSONValue[]

export type JSONObject = Record<string, JSONValue>

export type VKApiResponse = JSONValue

export interface WebTokenError {
  type: 'unauthorized' | 'exception'
  serializedError: ErrorObject | null
}

export interface WebToken {
  userId: string
  accessToken: string
  expires: number
  logoutHash: string
  error: WebTokenError | null
}

export interface TrackArtist {
  id: string
  name: string
}

export enum TrackFlagBit {
  HAS_LYRICS = 1 << 0,
  CAN_ADD = 1 << 1,
  CLAIMED = 1 << 2,
  QUEUE = 1 << 3,
  HQ = 1 << 4,
  LONG_PERFORMER = 1 << 5,
  UMA = 1 << 7,
  REPLACEABLE = 1 << 9,
  EXPLICIT = 1 << 10,
}

export interface TrackItem {
  id: string
  accessKey: string
  url: string
  image: string
  artist: string
  mainArtists: TrackArtist[]
  featArtists: TrackArtist[]
  title: string
  duration: number
  context: string
  flags: number // TrackFlagBit
  trackCode: string
  addHash: string
  editHash: string
  actionHash: string
  deleteHash: string
  replaceHash: string
  urlHash: string
  restoreHash: string
}

export interface Playlist {
  id: string
  blockId: string
  title: string
  tracks: TrackItem[]
  isRadio: boolean
  accessHash: string
  ownerId: string
  nextOffset: string
  hasMore: boolean
  followHash: string
  isFollowed: boolean
}

export type AudioTuple = [audioRawId: string, accessKey: string]

export enum ContentTab {
  UNKNOWN = 'unknown',
  CURRENT_PLAYLIST = 'current-playlist',
  GENERAL = 'general',
  MY_MUSIC = 'my-music',
  EXPLORE = 'explore',
  SEARCH = 'search',
  PLAYLIST = 'playlist',
  ALBUMS = 'albums',
  ARTIST = 'artist',
}

export enum RepeatMode {
  NONE = 0,
  REPEAT = 1,
  REPEAT_ONE = 2,
}

export enum EndOfStreamReason {
  NEXT = 'next_btn',
  PREV = 'prev',
  PLAYLIST_CHANGE = 'playlist_change',
  PLAYLIST_NEXT = 'playlist_next',
  PAUSE = 'stop_btn',
  SESSION_END = 'session_end',
  NEW = 'new',
}

export enum AudioTupleIndex {
  ID = 0,
  OWNER_ID = 1,
  URL = 2,
  TITLE = 3,
  PERFORMER = 4,
  DURATION = 5,
  ALBUM_ID = 6,
  AUTHOR_LINK = 8,
  LYRICS = 9,
  FLAGS = 10,
  CONTEXT = 11,
  EXTRA = 12,
  HASHES = 13,
  COVER_URL = 14,
  ADS = 15,
  SUBTITLE = 16,
  MAIN_ARTISTS = 17,
  FEAT_ARTISTS = 18,
  ALBUM = 19,
  TRACK_CODE = 20,
  RESTRICTION = 21,
  ALBUM_PART = 22,
  ACCESS_KEY = 24,
  CHART_INFO = 25,
  TRACK_PAGE_ID = 26,
  IS_ORIGINAL_SOUND = 27,
}

export enum DurationMode {
  TIME_PASSED = 0,
  TIME_LEFT = 1,
}

export enum Theme {
  SYSTEM = 'system',
  LIGHT = 'light',
  DARK = 'dark',
}

export type ClickableContentTabs = ContentTab.CURRENT_PLAYLIST | ContentTab.GENERAL | ContentTab.MY_MUSIC | ContentTab.EXPLORE

export interface ActiveTabUnknown {
  tab: ContentTab.UNKNOWN
}

export interface ActiveTabSearch {
  tab: ContentTab.SEARCH
  value: string
}

export interface ActiveTabArtist {
  tab: ContentTab.ARTIST
  id: string
  name: string
  history?: ActiveTabs[]
}

export interface ActiveTabCommon {
  tab: ClickableContentTabs
}

export interface ActiveTabPlaylist {
  tab: ContentTab.PLAYLIST
  fromId: string
  playlist: Playlist
  history?: ActiveTabs[]
}

export interface ActiveTabAlbums {
  tab: ContentTab.ALBUMS
  title: string
  showAllLink: string
  history?: ActiveTabs[]
}

export type TabWithHistory = ActiveTabPlaylist | ActiveTabAlbums

export type ActiveTabs = (
  ActiveTabUnknown
  | ActiveTabCommon
  | ActiveTabSearch
  | ActiveTabPlaylist
  | ActiveTabAlbums
  | ActiveTabArtist
)

export interface ApplicationControlsState {
  volume: number
  shuffle: boolean
  repeat: RepeatMode
  durationMode: DurationMode
}

export interface ApplicationSettingsState {
  theme: Theme
}

export interface ApplicationActiveTrackState {
  played: boolean
  activeTrack: TrackItem | null
  duration: number
  currentPlaylist: Playlist | null
}

export interface ApplicationCurrentTimeState {
  currentTime: number
}

export interface ApplicationPlaylistSystemState {
  activeTrackIndex: number
  audiosIds: AudioTuple[]
  originalAudiosIds: AudioTuple[]
  hlsDebug: boolean
}

export interface ApplicationUserState {
  userId: string
  webToken: WebToken | null
  deviceId: string
}

export interface ApplicationActiveTabState {
  activeTab: ActiveTabs
}

export type ApplicationState =
  ApplicationControlsState &
  ApplicationSettingsState &
  ApplicationActiveTrackState &
  ApplicationCurrentTimeState &
  ApplicationPlaylistSystemState &
  ApplicationUserState &
  ApplicationActiveTabState &
  Record<string, string | WebToken | Playlist | TrackItem | number | boolean | AudioTuple[] | ActiveTabs | null | undefined>

export interface RepeatMessage {
  type: 'repeat'
}

export interface AddToQueueMessage {
  type: 'add-to-queue'
  track: TrackItem
}

export interface CurrentTimeMessage {
  type: 'current-time'
  value: number
}

export interface NextTrackMessage {
  type: 'next-track'
}

export interface ActiveTrackMessage {
  type: 'active-track'
  trackIndex: number
  playlist: Playlist
}

export interface PreviousTrackMessage {
  type: 'previous-track'
}

export interface DeleteTrackMessage {
  type: 'delete-track'
  track: TrackItem
}

export type EditActions = Array<['move', number, number] | ['remove', number]>

export interface EditCurrentPlaylistMessage {
  type: 'edit-current-playlist'
  playlist: Playlist
  oldPlaylist: Playlist
  actions: EditActions
}

export type Messages = (
  RepeatMessage
  | AddToQueueMessage
  | CurrentTimeMessage
  | NextTrackMessage
  | ActiveTrackMessage
  | PreviousTrackMessage
  | DeleteTrackMessage
  | EditCurrentPlaylistMessage
)

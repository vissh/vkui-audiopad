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

export type TrackFlagMask = (
  typeof TrackFlagBit.HAS_LYRICS
  | typeof TrackFlagBit.CAN_ADD
  | typeof TrackFlagBit.CLAIMED
  | typeof TrackFlagBit.QUEUE
  | typeof TrackFlagBit.HQ
  | typeof TrackFlagBit.LONG_PERFORMER
  | typeof TrackFlagBit.UMA
  | typeof TrackFlagBit.REPLACEABLE
  | typeof TrackFlagBit.EXPLICIT
)
export interface TrackItem {
  id: string
  fromAct: boolean
  accessKey: string
  url: string
  image: string
  artist: string
  mainArtists: TrackArtist[]
  featArtists: TrackArtist[]
  title: string
  duration: number
  context: string
  flags: TrackFlagMask
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
  isVkMix: boolean
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
  likeVersion: number
  settingsVersion: number
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

export enum MessageTarget {
  SERVICE_WORKER = 'service-worker',
  OFFSCREEN = 'offscreen',
}

export enum MessageType {
  REPEAT = 'repeat',
  ADD_TO_QUEUE = 'add-to-queue',
  CURRENT_TIME = 'current-time',
  NEXT_TRACK = 'next-track',
  ACTIVE_TRACK = 'active-track',
  PREVIOUS_TRACK = 'previous-track',
  DELETE_TRACK = 'delete-track',
  EDIT_CURRENT_PLAYLIST = 'edit-current-playlist',
  RELOAD_TRACK = 'reload-track',
  AUDIO_PLAYER_PLAYING = 'audio-player-playing',
  AUDIO_PLAYER_PAUSE = 'audio-player-pause',
  AUDIO_PLAYER_ENDED = 'audio-player-ended',
  AUDIO_PLAYER_ERROR = 'audio-player-error',
  AUDIO_PLAYER_TIMEUPDATED = 'audio-player-timeupdate',
  CLOSE_OFFSCREEN_DOCUMENT = 'close-offscreen-document',
  PLAY_TRACK = 'play-track',
  PLAY_OR_PAUSE = 'play-or-pause',
  CHANGE_VOLUME = 'change-volume',
  CHANGE_CURRENT_TIME = 'change-current-time'
}

interface IServiceWorkerMessage {
  target: MessageTarget.SERVICE_WORKER
}

interface IOffscreenMessage {
  target: MessageTarget.OFFSCREEN
}

export interface RepeatMessage extends IServiceWorkerMessage {
  type: MessageType.REPEAT
}

export interface AddToQueueMessage extends IServiceWorkerMessage {
  type: MessageType.ADD_TO_QUEUE
  track: TrackItem
}

export interface CurrentTimeMessage extends IServiceWorkerMessage {
  type: MessageType.CURRENT_TIME
  value: number
}

export interface NextTrackMessage extends IServiceWorkerMessage {
  type: MessageType.NEXT_TRACK
}

export interface ActiveTrackMessage extends IServiceWorkerMessage {
  type: MessageType.ACTIVE_TRACK
  trackId: string | null
  playlist: Playlist
}

export interface PreviousTrackMessage extends IServiceWorkerMessage {
  type: MessageType.PREVIOUS_TRACK
}

export interface DeleteTrackMessage extends IServiceWorkerMessage {
  type: MessageType.DELETE_TRACK
  track: TrackItem
}

export type EditActions = Array<['move', number, number] | ['remove', number]>

export interface EditCurrentPlaylistMessage extends IServiceWorkerMessage {
  type: MessageType.EDIT_CURRENT_PLAYLIST
  playlist: Playlist
  oldPlaylist: Playlist
  actions: EditActions
}

export interface ReloadTrackMessage extends IServiceWorkerMessage {
  type: MessageType.RELOAD_TRACK
}

export interface AudioPlayerPlayingMessage extends IServiceWorkerMessage {
  type: MessageType.AUDIO_PLAYER_PLAYING
  volume: number
  duration: number
  currentTime: number
}

export interface AudioPlayerPauseMessage extends IServiceWorkerMessage {
  type: MessageType.AUDIO_PLAYER_PAUSE
}

export interface AudioPlayerEndedMessage extends IServiceWorkerMessage {
  type: MessageType.AUDIO_PLAYER_ENDED
}

export interface AudioPlayerErrorMessage extends IServiceWorkerMessage {
  type: MessageType.AUDIO_PLAYER_ERROR
}

export interface CloseOffscreenDocumentMessage extends IServiceWorkerMessage {
  type: MessageType.CLOSE_OFFSCREEN_DOCUMENT
}

export interface AudioPlayerTimeupdateMessage extends IServiceWorkerMessage {
  type: MessageType.AUDIO_PLAYER_TIMEUPDATED
  paused: boolean
  duration: number
  currentTime: number
}

export type ServiceWorkerMessage = (
  RepeatMessage
  | AddToQueueMessage
  | CurrentTimeMessage
  | NextTrackMessage
  | ActiveTrackMessage
  | PreviousTrackMessage
  | DeleteTrackMessage
  | EditCurrentPlaylistMessage
  | ReloadTrackMessage
  | AudioPlayerPlayingMessage
  | AudioPlayerPauseMessage
  | AudioPlayerEndedMessage
  | AudioPlayerErrorMessage
  | AudioPlayerTimeupdateMessage
  | CloseOffscreenDocumentMessage
)

export interface OffscreenPlayTrackMessage extends IOffscreenMessage {
  type: MessageType.PLAY_TRACK
  url: string
  volume: number
}

export interface OffscreenPlayOrPauseMessage extends IOffscreenMessage {
  type: MessageType.PLAY_OR_PAUSE
  played: boolean
}

export interface OffscreenChangeVolumeMessage extends IOffscreenMessage {
  type: MessageType.CHANGE_VOLUME
  value: number
}

export interface OffscreenChangeCurrentTimeMessage extends IOffscreenMessage {
  type: MessageType.CHANGE_CURRENT_TIME
  value: number
}

export type OffscreenMessage = (
  OffscreenPlayTrackMessage
  | OffscreenPlayOrPauseMessage
  | OffscreenChangeVolumeMessage
  | OffscreenChangeCurrentTimeMessage
)

export type Message = (
  ServiceWorkerMessage
  | OffscreenMessage
)

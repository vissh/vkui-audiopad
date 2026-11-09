import { type ErrorObject } from 'serialize-error'
import { type Settings as EqualizerSettings, type Status as EqualizerStatus } from './equalizer'
import { type MixPreferences } from './vk-mix'

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

export interface SessionIdentity {
  epoch: string
  userId: string
}

export interface SessionSnapshot {
  identity: SessionIdentity
  token: WebToken
}

export type SessionOperation =
  | { kind: 'verify' }
  | { kind: 'token', identity: SessionIdentity }
  | { kind: 'refresh', identity: SessionIdentity, rejectedToken: string }
  | { kind: 'assert', identity: SessionIdentity }

export type SessionReply =
  | { requestId: string, ok: true, snapshot: SessionSnapshot }
  | { requestId: string, ok: false, error: ErrorObject }

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
  0
  | typeof TrackFlagBit.HAS_LYRICS
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
  radioFollowed?: boolean
  radioBackground?: string
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
  mixId?: string
  mixOptions?: string
  mixEntityId?: string
  catalogLink?: string
  catalogLayout?: string
  accessHash: string
  ownerId: string
  nextOffset: string
  hasMore: boolean
  followHash: string
  isFollowed: boolean
  canFollow?: boolean
  followedPlaylist?: { ownerId: string, id: string }
}

export type AudioTuple = [audioRawId: string, accessKey: string]

export enum ContentTab {
  UNKNOWN = 'unknown',
  CURRENT_PLAYLIST = 'current-playlist',
  GENERAL = 'general',
  MY_MUSIC = 'my-music',
  EXPLORE = 'explore',
  RADIO = 'radio',
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

export type ClickableContentTabs = ContentTab.CURRENT_PLAYLIST | ContentTab.GENERAL | ContentTab.MY_MUSIC | ContentTab.EXPLORE | ContentTab.RADIO

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
  volumeBeforeMute: number
  shuffle: boolean
  repeat: RepeatMode
  durationMode: DurationMode
  castToStatus: boolean
}

export interface ApplicationSettingsState {
  equalizer: EqualizerSettings
  theme: Theme
  likeVersion: number
  settingsVersion: number
  equalizerAnnouncementPending: boolean
  vkMixPreferences: Record<string, MixPreferences>
}

export type PlaybackSelection = Pick<Playlist, 'id' | 'ownerId' | 'blockId' | 'isVkMix' | 'mixId' | 'mixOptions' | 'mixEntityId'>

export interface ApplicationActiveTrackState {
  played: boolean
  playbackRequested: boolean
  playbackInitialization: 'loading' | 'ready' | 'failed'
  playbackId: string | null
  playbackError: string | null
  activeTrack: TrackItem | null
  duration: number
  currentPlaylist: Playlist | null
  playbackSelection: PlaybackSelection | null
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
  sessionEpoch: string
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
  Record<string, string | WebToken | Playlist | PlaybackSelection | TrackItem | number | boolean | AudioTuple[] | ActiveTabs | EqualizerSettings | Record<string, MixPreferences> | null | undefined>

export enum MessageTarget {
  SERVICE_WORKER = 'service-worker',
  OFFSCREEN = 'offscreen',
}

export enum MessageType {
  SESSION_REQUEST = 'session-request',
  SESSION_CANCEL = 'session-cancel',
  REPEAT = 'repeat',
  ADD_TO_QUEUE = 'add-to-queue',
  CURRENT_TIME = 'current-time',
  NEXT_TRACK = 'next-track',
  ACTIVE_TRACK = 'active-track',
  PREVIOUS_TRACK = 'previous-track',
  DELETE_TRACK = 'delete-track',
  EDIT_CURRENT_PLAYLIST = 'edit-current-playlist',
  APPEND_CURRENT_PLAYLIST = 'append-current-playlist',
  RELOAD_TRACK = 'reload-track',
  AUDIO_PLAYER_PLAYING = 'audio-player-playing',
  AUDIO_PLAYER_PAUSE = 'audio-player-pause',
  AUDIO_PLAYER_ENDED = 'audio-player-ended',
  AUDIO_PLAYER_ERROR = 'audio-player-error',
  AUDIO_PLAYER_TIMEUPDATED = 'audio-player-timeupdate',
  CLOSE_OFFSCREEN_DOCUMENT = 'close-offscreen-document',
  PLAY_TRACK = 'play-track',
  PLAY_OR_PAUSE = 'play-or-pause',
  TOGGLE_PLAYBACK = 'toggle-playback',
  GET_PLAYER_SNAPSHOT = 'get-player-snapshot',
  PLAYER_SNAPSHOT = 'player-snapshot',
  CHANGE_VOLUME = 'change-volume',
  CHANGE_EQUALIZER = 'change-equalizer',
  RETRY_EQUALIZER = 'retry-equalizer',
  EQUALIZER_STATUS = 'equalizer-status',
  CHANGE_CURRENT_TIME = 'change-current-time'
}

interface IServiceWorkerMessage {
  target: MessageTarget.SERVICE_WORKER
}

interface IOffscreenMessage {
  target: MessageTarget.OFFSCREEN
}

export interface SessionRequestMessage extends IServiceWorkerMessage {
  type: MessageType.SESSION_REQUEST
  requestId: string
  operation: SessionOperation
}

export interface SessionCancelMessage extends IServiceWorkerMessage {
  type: MessageType.SESSION_CANCEL
  requestId: string
}

export interface RepeatMessage extends IServiceWorkerMessage {
  type: MessageType.REPEAT
}

export interface PlaybackControlMessage extends IServiceWorkerMessage {
  type: MessageType.PLAY_OR_PAUSE
  played: boolean
}

export interface TogglePlaybackMessage extends IServiceWorkerMessage {
  type: MessageType.TOGGLE_PLAYBACK
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

export interface AppendCurrentPlaylistMessage extends IServiceWorkerMessage {
  type: MessageType.APPEND_CURRENT_PLAYLIST
  basePlaylist: Playlist
  playlist: Playlist
}

export interface ReloadTrackMessage extends IServiceWorkerMessage {
  type: MessageType.RELOAD_TRACK
}

interface AudioPlayerMessage extends IServiceWorkerMessage {
  playbackId: string
}

export interface AudioPlayerPlayingMessage extends AudioPlayerMessage {
  type: MessageType.AUDIO_PLAYER_PLAYING
  volume: number
  duration: number
  currentTime: number
}

export interface AudioPlayerPauseMessage extends AudioPlayerMessage {
  type: MessageType.AUDIO_PLAYER_PAUSE
}

export interface AudioPlayerEndedMessage extends AudioPlayerMessage {
  type: MessageType.AUDIO_PLAYER_ENDED
}

export interface AudioPlayerErrorMessage extends AudioPlayerMessage {
  type: MessageType.AUDIO_PLAYER_ERROR
}

export interface PlayerSnapshot {
  documentId: string
  activityRevision: number
  idle: boolean
  playbackId: string | null
  hasSource: boolean
  requested: boolean
  paused: boolean
  playing: boolean
  ended: boolean
  failed: boolean
  currentTime: number
  duration: number
}

export interface PlayerSnapshotMessage extends IServiceWorkerMessage {
  type: MessageType.PLAYER_SNAPSHOT
  requestId: string
  snapshot: PlayerSnapshot
}

export interface GetPlayerSnapshotMessage extends IOffscreenMessage {
  type: MessageType.GET_PLAYER_SNAPSHOT
  requestId: string
}

export interface CloseOffscreenDocumentMessage extends IServiceWorkerMessage {
  type: MessageType.CLOSE_OFFSCREEN_DOCUMENT
  documentId: string
  playbackId: string | null
  activityRevision: number
}

export interface AudioPlayerTimeupdateMessage extends AudioPlayerMessage {
  type: MessageType.AUDIO_PLAYER_TIMEUPDATED
  paused: boolean
  duration: number
  currentTime: number
}

export interface EqualizerStatusMessage extends IServiceWorkerMessage {
  type: MessageType.EQUALIZER_STATUS
  playbackId: string | null
  status: EqualizerStatus
}

export interface RetryEqualizerMessage extends IServiceWorkerMessage {
  type: MessageType.RETRY_EQUALIZER
}

export type ServiceWorkerMessage = (
  EqualizerStatusMessage
  | RetryEqualizerMessage
  | RepeatMessage
  | SessionRequestMessage
  | SessionCancelMessage
  | PlaybackControlMessage
  | TogglePlaybackMessage
  | AddToQueueMessage
  | CurrentTimeMessage
  | NextTrackMessage
  | ActiveTrackMessage
  | PreviousTrackMessage
  | DeleteTrackMessage
  | EditCurrentPlaylistMessage
  | AppendCurrentPlaylistMessage
  | ReloadTrackMessage
  | AudioPlayerPlayingMessage
  | AudioPlayerPauseMessage
  | AudioPlayerEndedMessage
  | AudioPlayerErrorMessage
  | AudioPlayerTimeupdateMessage
  | CloseOffscreenDocumentMessage
  | PlayerSnapshotMessage
)

export interface OffscreenPlayTrackMessage extends IOffscreenMessage {
  type: MessageType.PLAY_TRACK
  playbackId: string
  url: string
  volume: number
  equalizer?: EqualizerSettings
  equalizerMixAccess?: boolean
}

export interface OffscreenChangeEqualizerMessage extends IOffscreenMessage {
  type: MessageType.CHANGE_EQUALIZER
  value: EqualizerSettings
  equalizerMixAccess?: boolean
  retry?: boolean
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
  | OffscreenChangeEqualizerMessage
  | GetPlayerSnapshotMessage
  | OffscreenPlayOrPauseMessage
  | OffscreenChangeVolumeMessage
  | OffscreenChangeCurrentTimeMessage
)

export type Message = (
  ServiceWorkerMessage
  | OffscreenMessage
)

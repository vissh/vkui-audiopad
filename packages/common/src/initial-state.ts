import { defaults as equalizerDefaults } from './equalizer'
import {
  ContentTab,
  DurationMode,
  RepeatMode,
  Theme,
  type ApplicationActiveTabState,
  type ApplicationActiveTrackState,
  type ApplicationControlsState,
  type ApplicationCurrentTimeState,
  type ApplicationPlaylistSystemState,
  type ApplicationSettingsState,
  type ApplicationState,
  type ApplicationUserState
} from './types'

export const ApplicationControls: ApplicationControlsState = {
  volume: 0.5,
  volumeBeforeMute: 0.5,
  shuffle: false,
  repeat: RepeatMode.NONE,
  durationMode: DurationMode.TIME_PASSED,
  castToStatus: false
}

export const ApplicationSettings: ApplicationSettingsState = {
  equalizer: equalizerDefaults,
  theme: Theme.SYSTEM,
  likeVersion: 0,
  settingsVersion: 0,
  equalizerAnnouncementPending: false,
  vkMixPreferences: {}
}

export const ApplicationActiveTrack: ApplicationActiveTrackState = {
  played: false,
  playbackRequested: false,
  playbackInitialization: 'loading',
  playbackId: null,
  playbackError: null,
  activeTrack: null,
  duration: 0,
  currentPlaylist: null,
  playbackSelection: null
}

export const CurrentTime: ApplicationCurrentTimeState = {
  currentTime: 0
}

export const PlaylistSystem: ApplicationPlaylistSystemState = {
  activeTrackIndex: -1,
  audiosIds: [],
  originalAudiosIds: [],
  hlsDebug: false
}

export const User: ApplicationUserState = {
  userId: '',
  sessionEpoch: 'legacy',
  webToken: null,
  deviceId: ''
}

export const InitialActiveTab: ApplicationActiveTabState = {
  activeTab: { tab: ContentTab.UNKNOWN }
}

export const DefaultActiveTab: ApplicationActiveTabState = {
  activeTab: { tab: ContentTab.GENERAL }
}

export const Application: ApplicationState = {
  ...ApplicationControls,
  ...ApplicationSettings,
  ...ApplicationActiveTrack,
  ...CurrentTime,
  ...PlaylistSystem,
  ...User,
  ...DefaultActiveTab
}

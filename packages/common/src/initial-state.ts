import {
  ContentTab,
  DurationMode,
  RepeatMode,
  Theme,
  type ApplicationActiveTrackState,
  type ApplicationControlsState,
  type ApplicationCurrentTimeState,
  type ApplicationPlaylistSystemState,
  type ApplicationSelectedTabState,
  type ApplicationSettingsState,
  type ApplicationState,
  type ApplicationUserState
} from './types'

export const ApplicationControls: ApplicationControlsState = {
  volume: 0.5,
  shuffle: false,
  repeat: RepeatMode.NONE,
  durationMode: DurationMode.TIME_PASSED
}

export const ApplicationSettings: ApplicationSettingsState = {
  theme: Theme.SYSTEM
}

export const ApplicationActiveTrack: ApplicationActiveTrackState = {
  played: false,
  activeTrack: null,
  duration: 0,
  currentPlaylist: null
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
  webToken: null,
  deviceId: ''
}

export const InitialSelectedTab: ApplicationSelectedTabState = {
  selectedTab: { tab: ContentTab.UNKNOWN }
}

export const DefaultSelectedTab: ApplicationSelectedTabState = {
  selectedTab: { tab: ContentTab.MY_MUSIC }
}

export const Application: ApplicationState = {
  ...ApplicationControls,
  ...ApplicationSettings,
  ...ApplicationActiveTrack,
  ...CurrentTime,
  ...PlaylistSystem,
  ...User,
  ...DefaultSelectedTab
}

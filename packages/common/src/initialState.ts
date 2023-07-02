import { EContentTab, EDurationMode, ERepeat, ETheme } from "./types/enums";
import {
    TApplicationActiveTrackState,
    TApplicationControlsState,
    TApplicationCurrentTimeState,
    TApplicationPlaylistSystemState,
    TApplicationSelectedTabState,
    TApplicationSettingsState,
    TApplicationState,
    TApplicationUserState,
} from "./types/state";


export const ApplicationControls: TApplicationControlsState = {
    volume: 0.5,
    shuffle: false,
    repeat: ERepeat.NONE,
    durationMode: EDurationMode.TIME_PASSED,
};

export const ApplicationSettings: TApplicationSettingsState = {
    theme: ETheme.SYSTEM,
};

export const ApplicationActiveTrack: TApplicationActiveTrackState = {
    played: false,
    activeTrack: null,
    duration: 0,
    currentPlaylist: null,
};

export const CurrentTime: TApplicationCurrentTimeState = {
    currentTime: 0,
};

export const PlaylistSystem: TApplicationPlaylistSystemState = {
    activeTrackIndex: -1,
    audiosIds: [],
    originalAudiosIds: [],
    hlsDebug: false,
};

export const User: TApplicationUserState = {
    userId: "",
    webToken: null,
    deviceId: "",
};

export const InitialSelectedTab: TApplicationSelectedTabState = {
    selectedTab: { tab: EContentTab.UNKNOWN },
};

export const DefaultSelectedTab: TApplicationSelectedTabState = {
    selectedTab: { tab: EContentTab.MY_MUSIC },
};

export const Application: TApplicationState = {
    ...ApplicationControls,
    ...ApplicationSettings,
    ...ApplicationActiveTrack,
    ...CurrentTime,
    ...PlaylistSystem,
    ...User,
    ...DefaultSelectedTab,
};

import { ContentTab, EnumRepeat, TApplicationSettingsState, TypeApplicationState } from "./types";

const ApplicationSettings: TApplicationSettingsState = {
    volume: 0.5,
    shuffle: false,
    repeat: EnumRepeat.NONE,
    appVersion: "",
    showIndicator: false,
};

export const Application: TypeApplicationState = {
    userId: "",
    webToken: null,
    deviceId: "",
    currentPlaylist: null,
    activeTrack: null,
    activeTrackIndex: -1,
    played: false,
    duration: 0,
    durationReverse: false,
    currentTime: 0,
    audiosIds: [],
    originalAudiosIds: [],
    selectedTab: { tab: ContentTab.UNKNOWN },
    ...ApplicationSettings
};

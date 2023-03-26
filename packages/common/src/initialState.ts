import { ContentTab, EnumRepeat, TypeApplicationState } from "./types";

export const Application: TypeApplicationState = {
    userId: "",
    volume: 0.5,
    repeat: EnumRepeat.NONE,
    webToken: null,
    deviceId: "",
    currentPlaylist: null,
    activeTrack: null,
    activeTrackIndex: -1,
    played: false,
    duration: 0,
    durationReverse: false,
    currentTime: 0,
    audiosIds: {},
    selectedTab: { tab: ContentTab.UNKNOWN },
};

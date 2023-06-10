import { TAudioTuple, TTitlePlaylist, TTrackItem, TWebToken } from "./base";
import { EDurationMode, ERepeat, ETheme } from "./enums";
import { TSelectedTabs } from "./tabs";

export type TApplicationControlsState = {
    volume: number;
    shuffle: boolean;
    repeat: ERepeat;
    durationMode: EDurationMode;
};

export type TApplicationSettingsState = {
    theme: ETheme;
};

export type TApplicationActiveTrackState = {
    played: boolean;
    activeTrack: TTrackItem | null;
    duration: number;
    currentPlaylist: TTitlePlaylist | null;
};

export type TApplicationCurrentTimeState = {
    currentTime: number;
};

export type TApplicationPlaylistSystemState = {
    activeTrackIndex: number;
    audiosIds: Array<TAudioTuple>;
    originalAudiosIds: Array<TAudioTuple>;
};

export type TApplicationUserState = {
    userId: string;
    webToken: TWebToken | null;
    deviceId: string;
};

export type TApplicationSelectedTabState = {
    selectedTab: TSelectedTabs;
};

export type TApplicationState =
    TApplicationControlsState &
    TApplicationSettingsState &
    TApplicationActiveTrackState &
    TApplicationCurrentTimeState &
    TApplicationPlaylistSystemState &
    TApplicationUserState &
    TApplicationSelectedTabState & {
        [index: string]: string | TWebToken | TTitlePlaylist | TTrackItem | number | boolean | Array<TAudioTuple> | TSelectedTabs | null | undefined;
    };

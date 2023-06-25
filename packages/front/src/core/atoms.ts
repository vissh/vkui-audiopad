import { initialState } from "@vk-audiopad/common";
import { atom, storageAtom } from "./atom";
import { EModalPage } from "./types/enums";

export const activeModalPageAtom = atom<EModalPage | null>(null);
export const popoutAtom = atom<React.ReactNode>(null);

export const playedAtom = storageAtom("played", initialState.ApplicationActiveTrack.played);
export const activeTrackAtom = storageAtom("activeTrack", initialState.ApplicationActiveTrack.activeTrack);
export const durationAtom = storageAtom("duration", initialState.ApplicationActiveTrack.duration);
export const currentPlaylistAtom = storageAtom("currentPlaylist", initialState.ApplicationActiveTrack.currentPlaylist);
export const volumeAtom = storageAtom("volume", initialState.ApplicationControls.volume);
export const shuffleAtom = storageAtom("shuffle", initialState.ApplicationControls.shuffle);
export const repeatAtom = storageAtom("repeat", initialState.ApplicationControls.repeat);
export const durationModeAtom = storageAtom("durationMode", initialState.ApplicationControls.durationMode);
export const currentTimeAtom = storageAtom("currentTime", initialState.CurrentTime.currentTime);
export const userIdAtom = storageAtom("userId", initialState.User.userId);
export const webTokenAtom = storageAtom("webToken", initialState.User.webToken);
export const deviceIdAtom = storageAtom("deviceId", initialState.User.deviceId);
export const selectedTabAtom = storageAtom("selectedTab", initialState.InitialSelectedTab.selectedTab, initialState.DefaultSelectedTab.selectedTab);
export const themeAtom = storageAtom("theme", initialState.ApplicationSettings.theme);

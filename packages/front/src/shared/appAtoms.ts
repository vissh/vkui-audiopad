import { baseTypes, initialState } from "@vk-audiopad/common";
import { atom, storageAtom } from "shared/lib/atom";
import { EModalPage } from "shared/types";

export const activeModalPageAtom = atom<EModalPage | null>(null);
export const popoutAtom = atom<React.ReactNode>(null);
export const trackArtistsAtom = atom<Array<baseTypes.TArtist>>([]);

export const userIdAtom = storageAtom("userId", initialState.User.userId);
export const selectedTabAtom = storageAtom("selectedTab", initialState.InitialSelectedTab.selectedTab, initialState.DefaultSelectedTab.selectedTab);
export const playedAtom = storageAtom("played", initialState.ApplicationActiveTrack.played);
export const activeTrackAtom = storageAtom("activeTrack", initialState.ApplicationActiveTrack.activeTrack);
export const durationAtom = storageAtom("duration", initialState.ApplicationActiveTrack.duration);
export const currentPlaylistAtom = storageAtom("currentPlaylist", initialState.ApplicationActiveTrack.currentPlaylist);
export const volumeAtom = storageAtom("volume", initialState.ApplicationControls.volume);
export const shuffleAtom = storageAtom("shuffle", initialState.ApplicationControls.shuffle);
export const repeatAtom = storageAtom("repeat", initialState.ApplicationControls.repeat);
export const durationModeAtom = storageAtom("durationMode", initialState.ApplicationControls.durationMode);
export const currentTimeAtom = storageAtom("currentTime", initialState.CurrentTime.currentTime);
export const deviceIdAtom = storageAtom("deviceId", initialState.User.deviceId);
export const themeAtom = storageAtom("theme", initialState.ApplicationSettings.theme);
export const hlsDebugAtom = storageAtom("hlsDebug", initialState.PlaylistSystem.hlsDebug);

import { initialState } from "@vk-audiopad/common";
import { storageAtom } from "shared/lib/atom";

export const userIdAtom = storageAtom("userId", initialState.User.userId);
export const playedAtom = storageAtom("played", initialState.ApplicationActiveTrack.played);
export const activeTrackAtom = storageAtom("activeTrack", initialState.ApplicationActiveTrack.activeTrack);
export const currentPlaylistAtom = storageAtom("currentPlaylist", initialState.ApplicationActiveTrack.currentPlaylist);

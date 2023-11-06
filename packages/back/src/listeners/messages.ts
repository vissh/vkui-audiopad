import { addToQueue } from "../actions/add-to-queue";
import { editCurrentPlaylist } from "../actions/edit-current-playlist";
import { nextTrack, previousTrack } from "../actions/next";
import { playNewTrack } from "../actions/play-new-track";
import { removeTrack } from "../actions/remove-track";
import { repeat } from "../actions/repeat";
import { audioElement } from "../player";

export const startListeningPopupMessages = () => {
    // Действия, которые приходит из popup'а.
    chrome.runtime.onMessage.addListener(async (request) => {
        const requestTypes = {
            activeTrack: async () => {
                return await playNewTrack(request.data.trackIndex, request.data.playlist, true);
            },
            nextTrack: async () => {
                await nextTrack();
            },
            previousTrack: async () => {
                await previousTrack();
            },
            currentTime: () => {
                audioElement.currentTime = request.data.value || 0;
            },
            repeat: async () => {
                await repeat();
            },
            editCurrentPlaylist: async () => {
                await editCurrentPlaylist(request.data.playlist, request.data.oldPlaylist, request.data.actions);
            },
            removeTrack: () => {
                removeTrack(request.data.track);
            },
            addToQueue: async () => {
                await addToQueue(request.data.track);
            }
        };

        const handler = requestTypes[request.type];
        handler && await handler();
    });
};

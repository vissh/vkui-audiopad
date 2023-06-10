import { addTrack } from "../actions/addTrack";
import { editCurrentPlaylist } from "../actions/editCurrentPlaylist";
import { nextTrack, previousTrack } from "../actions/next";
import { playNewTrack } from "../actions/playNewTrack";
import { removeTrack } from "../actions/removeTrack";
import { repeat } from "../actions/repeat";
import { playerElement } from "../state";

export const startListiningPopupMessages = () => {
    // Действия, которые приходит из popup'а.
    chrome.runtime.onMessage.addListener(async (request, _, sendResponse) => {
        const requestTypes = {
            activeTrack: async () => {
                return await playNewTrack(request.data.trackIndex, request.data.playlist);
            },
            nextTrack: async () => {
                await nextTrack();
            },
            previousTrack: async () => {
                await previousTrack();
            },
            currentTime: async () => {
                playerElement.currentTime = request.data.value || 0;
                sendResponse();
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
            addTrack: () => {
                addTrack(request.data.track);
            },
        };

        const handler = requestTypes[request.type];
        handler && await handler();
    });
};

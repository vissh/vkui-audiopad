import { storage } from "@vk-audiopad/common";
import { destroyPlayer, reloadTrack } from "../actions";
import { applicationState, playerElement } from "../state";
import { setBadgeText, shuffle } from "../utils";

export const startListiningStorageEvents = () => {
    storage.durationReverse.listen(onDurationReverse);
    storage.volume.listen(onVolumeChange);
    storage.played.listen(onPlayed);
    storage.shuffle.listen(onShuffle);
};

const onDurationReverse = (durationReverse: boolean | undefined) => {
    if (durationReverse !== undefined) {
        setBadgeText(durationReverse);
    }
};

const onVolumeChange = (volume: number | undefined) => {
    if (volume !== undefined) {
        playerElement.volume = volume;
    }
};

const onPlayed = async (played: boolean | undefined) => {
    if (played === undefined) {
        destroyPlayer();
        chrome.browserAction.setBadgeText({ text: "" });
        return;
    }

    if (!played) {
        playerElement.src && playerElement.pause();
        chrome.browserAction.setBadgeText({ text: "" });
        return;
    }

    if (playerElement.src) {
        playerElement.play();
        return;
    }

    await reloadTrack();
};


const onShuffle = async (shuffleValue: boolean | undefined) => {
    if (shuffleValue === undefined || applicationState.activeTrackIndex === -1) {
        return;
    }

    const audiosIds = applicationState.audiosIds || [];

    if (shuffleValue) {
        const shuffledAudiosIds = shuffle(audiosIds);
        const updateValues = { audiosIds: shuffledAudiosIds, originalAudiosIds: audiosIds };

        const [trackId] = audiosIds[applicationState.activeTrackIndex];
        const newActiveIndex = shuffledAudiosIds.findIndex(([elementTrackId]) => elementTrackId === trackId);
        if (newActiveIndex !== undefined) {
            updateValues["activeTrackIndex"] = newActiveIndex;
        }

        await storage.set(updateValues);

    } else {
        const updateValues = { audiosIds: applicationState.originalAudiosIds, originalAudiosIds: [] };

        const [trackId] = audiosIds[applicationState.activeTrackIndex];
        const newActiveIndex = updateValues.audiosIds.findIndex(([elementTrackId]) => elementTrackId === trackId);
        if (newActiveIndex !== undefined) {
            updateValues["activeTrackIndex"] = newActiveIndex;
        }

        await storage.set(updateValues);
    }
};

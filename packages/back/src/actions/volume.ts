import { audioElement } from "../player";

export const onVolumeChange = (volume: number | undefined) => {
    if (volume !== undefined) {
        audioElement.volume = volume;
    }
};

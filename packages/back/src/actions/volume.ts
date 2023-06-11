import { playerElement } from "../state";

export const onVolumeChange = (volume: number | undefined) => {
    if (volume !== undefined) {
        playerElement.volume = volume;
    }
};

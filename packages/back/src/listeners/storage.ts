import { onDurationMode } from "../actions/durationMode";
import { onPlayed } from "../actions/playPause";
import { onShuffle } from "../actions/shuffle";
import { onVolumeChange } from "../actions/volume";
import { storage } from "../storage";

export const startListiningStorageEvents = () => {
    storage.durationMode.listen(onDurationMode);
    storage.volume.listen(onVolumeChange);
    storage.played.listen(onPlayed);
    storage.shuffle.listen(onShuffle);
};

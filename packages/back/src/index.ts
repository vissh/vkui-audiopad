import { state, types } from "@vk-audiopad/common";
import { debounceTime, distinctUntilChanged, fromEvent } from "rxjs";

const playerElement = document.getElementById("audio-player") as HTMLVideoElement;

// fromEvent(playerElement, "play")
//     .subscribe(x => { });

// fromEvent(playerElement, "pause")
//     .subscribe(x => { });

// fromEvent(playerElement, "ended")
//     .subscribe(x => { });

// fromEvent(playerElement, "error")
//     .subscribe(x => { });

fromEvent(playerElement, "durationchange")
    .pipe(
        debounceTime(200),
        distinctUntilChanged(),
    )
    .subscribe(x => {
        state.activeDuration.set(x as unknown as number);
    });

state.activeTrack.listen((activeTrack: types.ITrackItem) => {
    console.log(activeTrack);
});

import { debounceTime, distinctUntilChanged, fromEvent } from "rxjs";

const playerElement = document.getElementById("audio-player");

// Playback has begun.
fromEvent(playerElement, "play")
    .subscribe(x => { });

// Playback has been paused.
fromEvent(playerElement, "pause")
    .subscribe(x => { });

// Playback has stopped because the end of the media was reached.
fromEvent(playerElement, "ended")
    .subscribe(x => { });

// An error occurred while fetching the media data, or the type of the resource is not a supported media format. 
fromEvent(playerElement, "error")
    .subscribe(x => { });

// The time indicated by the currentTime attribute has been updated.
fromEvent(playerElement, "durationchange")
    .pipe(
        debounceTime(500),
        distinctUntilChanged(),
    )
    .subscribe(x => { });


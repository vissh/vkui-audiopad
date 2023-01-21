import { distinctUntilChanged, Subject } from "rxjs";
import { ITitlePlaylist, ITrackItem } from "./types";

class State<T> {
    stateName: string;
    subject$: Subject<T>;
    comparator?: (previous: T, current: T) => boolean;

    constructor(stateName: string, subject$: Subject<T>, comparator?: (previous: T, current: T) => boolean) {
        this.stateName = stateName;
        this.subject$ = subject$;
        this.comparator = comparator;
    }

    set(value: T) {
        this.subject$.next(value);
        chrome.storage.local.set({ [this.stateName]: value });
    }

    listen(callback: (value: T) => void) {
        chrome.storage.local.onChanged.addListener(changes => {
            if (changes.hasOwnProperty(this.stateName)) {
                this.subject$.next(changes[this.stateName] as T);
            }
        });

        this.subject$
            .pipe(distinctUntilChanged(this.comparator))
            .subscribe(callback);
    }
}

const idComparator = (previous: any, current: any) => previous.id === current.id;

const activeTrack$ = new Subject<ITrackItem>();
const activeDuration$ = new Subject<number>();
const play$ = new Subject<boolean>();
const currentPlaylist$ = new Subject<ITitlePlaylist>();

export const activeTrack = new State<ITrackItem>("activeTrack", activeTrack$, idComparator);
export const activeDuration = new State<number>("activeDuration", activeDuration$);
export const play = new State<boolean>("played", play$);
export const currentPlaylist = new State<ITitlePlaylist>("currentPlaylist", currentPlaylist$, idComparator);


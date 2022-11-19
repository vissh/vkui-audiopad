import { FC } from "react";
import { Search } from "@vkontakte/vkui";
import {
    Subject,
    debounceTime,
    switchMap,
    distinctUntilChanged,
    tap,
    from
} from "rxjs"

import "@vkontakte/vkui/dist/vkui.css";

import { audioSearch } from "../vkcom/client";
import { useCurrentPlaylistActions } from "../hooks/useActions";


export const SearchTracks: FC = () => {
    const { loading, loaded, setTracks } = useCurrentPlaylistActions();

    const inputStream$ = new Subject();
    inputStream$
        .pipe(
            debounceTime(600),
            distinctUntilChanged(),
            tap(loading),
            switchMap(value => from(audioSearch(value as string))),
            tap(loaded),
        )
        .subscribe({
            next: setTracks,
        });

    return (
        <Search onChange={event => inputStream$.next(event.target.value)} />
    );
};

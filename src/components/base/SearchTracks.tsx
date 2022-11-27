import "@vkontakte/vkui/dist/vkui.css";

import { Search } from "@vkontakte/vkui";
import { FC } from "react";
import { debounceTime, distinctUntilChanged, from, Subject, switchMap } from "rxjs";

import { audioSearch } from "../../vkcom/client";

export const SearchTracks: FC = () => {

    const inputStream$ = new Subject();
    inputStream$
        .pipe(
            debounceTime(500),
            distinctUntilChanged(),
            // tap(() => setLoading(true)),
            switchMap(value => from(audioSearch(value as string))),
            // tap(() => setLoading(false)),
        )
        .subscribe({
            next: () => { },
        });

    return (
        <Search onChange={event => inputStream$.next(event.target.value)} />
    );
};

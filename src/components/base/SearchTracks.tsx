import "@vkontakte/vkui/dist/vkui.css";

import { Search } from "@vkontakte/vkui";
import { FC } from "react";
import { debounceTime, distinctUntilChanged, Subject } from "rxjs";

import { useSearchTracksActions, useTabActions } from "../../hooks/useActions";
import { ContentTab } from "../../types";

export const SearchTracks: FC = () => {
    const { setTab } = useTabActions();
    const { setSearchValue } = useSearchTracksActions();

    const inputStream$ = new Subject();
    inputStream$
        .pipe(
            debounceTime(500),
            distinctUntilChanged(),
        )
        .subscribe({
            next: (value) => {
                setTab(ContentTab.SEARCH);
                setSearchValue(value as string);
            },
        });

    return (
        <Search onChange={event => inputStream$.next(event.target.value)} />
    );
};

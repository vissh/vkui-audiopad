import '@vkontakte/vkui/dist/vkui.css';

import { FC } from 'react';
import { debounceTime, distinctUntilChanged, from, Subject, switchMap, tap } from 'rxjs';

import { Search } from '@vkontakte/vkui';

import { useCurrentPlaylistActions } from '../hooks/useActions';
import { audioSearch } from '../vkcom/client';

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

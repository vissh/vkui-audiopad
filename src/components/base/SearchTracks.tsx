import '@vkontakte/vkui/dist/vkui.css';

import { Search } from '@vkontakte/vkui';
import { FC } from 'react';
import { debounceTime, distinctUntilChanged, from, Subject, switchMap, tap } from 'rxjs';

import { useSearchActions } from '../../hooks/useActions';
import { audioSearch } from '../../vkcom/client';

export const SearchTracks: FC = () => {
    const { loading, loaded, setTracks } = useSearchActions();

    const inputStream$ = new Subject();
    inputStream$
        .pipe(
            debounceTime(500),
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

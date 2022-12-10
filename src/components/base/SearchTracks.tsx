import "@vkontakte/vkui/dist/vkui.css";

import { Search } from "@vkontakte/vkui";
import React, { FC, useEffect, useState } from "react";
import { debounceTime, distinctUntilChanged, Subject } from "rxjs";

import { useSearchTracksActions, useTabActions } from "../../hooks/useActions";
import { useTypedSelector } from "../../hooks/useTypedSelector";
import { ContentTab } from "../../types";

export const SearchTracks: FC = () => {
    const { setTab } = useTabActions();
    const { setSearchValue } = useSearchTracksActions();
    const { selectedTab } = useTypedSelector(state => state.selectedTab);
    const [count, setCount] = useState(0);

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

    useEffect(() => {
        if (selectedTab !== ContentTab.SEARCH) {
            setCount(c => c + 1);
        }

        // eslint-disable-next-line  
    }, [selectedTab])

    return (
        <React.Fragment>
            {/* TODO: Феерический костыль. Нужно очищать поисковый инпут при переключении вкладки, но не очищать при самом поиске.*/}
            {count % 2 === 0
                ? <Search onChange={e => inputStream$.next(e.target.value)} />
                : <React.Fragment>
                    <Search onChange={e => inputStream$.next(e.target.value)} />
                </React.Fragment>
            }
        </React.Fragment>
    );
};

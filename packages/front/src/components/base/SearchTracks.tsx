import "@vkontakte/vkui/dist/vkui.css";

import { storage, types } from "@vk-audiopad/common";
import { Search } from "@vkontakte/vkui";
import { FC, useEffect, useState } from "react";
import { debounceTime, distinctUntilChanged, Subject } from "rxjs";

import { useSearchTracksActions } from "../../hooks/useActions";
import { useTypedSelector } from "../../hooks/useTypedSelector";

export const SearchTracks: FC = () => {
    const { selectedTab } = useTypedSelector(state => state.application);
    const { value } = useTypedSelector(state => state.search);

    const { setValue } = useSearchTracksActions();

    const [inputStream$] = useState(new Subject());

    const onChange = (e: any) => {
        setValue(e.target.value);
        inputStream$.next(e.target.value);
    };

    useEffect(() => {
        const subsribtion = inputStream$
            .pipe(
                debounceTime(600),
                distinctUntilChanged(),
            )
            .subscribe(async (value) => {
                await storage.set({
                    selectedTab: {
                        tab: types.ContentTab.SEARCH,
                        value: value as string,
                    },
                });
            });

        return () => { subsribtion.unsubscribe() }
    }, []);

    useEffect(() => {
        setValue(selectedTab.tab === types.ContentTab.SEARCH ? selectedTab.value : "");
    }, [selectedTab]);

    return (
        <Search value={value} onChange={onChange} />
    );
};

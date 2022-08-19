import { FC, useEffect, useState } from "react";
import {
    Search,
} from "@vkontakte/vkui";

import "@vkontakte/vkui/dist/vkui.css";
import { IAddTracks } from "../types";
import { audioSearch } from "../vkcom/client";

export const SearchTracks: FC<IAddTracks> = (setTracks) => {
    const [query, setQuery] = useState("");
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>();

    useEffect(() => {
        clearTimeout(timeoutId);
        let fn = () => audioSearch(setTracks.setTracks, query);
        !query && !timeoutId ? fn() : setTimeoutId(setTimeout(fn, 500));
    }, [query]);

    return (
        <Search onChange={event => setQuery(event.target.value)} />
    );
};

import { FC, useEffect, useState } from "react";
import {
    Search,
} from "@vkontakte/vkui";

import "@vkontakte/vkui/dist/vkui.css";
import { IAddTracks } from "../types";
import { audioSearch } from "../vkcom/client";


export const SearchTracks: FC<IAddTracks> = (setTracks) => {
    const [query, setQuery] = useState("")

    useEffect(() => {
        const timeoutId = setTimeout(() => audioSearch(setTracks.setTracks, query), 500);
        return () => clearTimeout(timeoutId);
    }, [query])

    return (
        <Search onChange={event => setQuery(event.target.value)} />
    );
};

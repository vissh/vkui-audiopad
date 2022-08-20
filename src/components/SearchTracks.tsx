import { FC, useEffect, useState } from "react";
import {
    Search,
} from "@vkontakte/vkui";

import "@vkontakte/vkui/dist/vkui.css";
import { audioSearch } from "../vkcom/client";
import { useCurrentPlaylistActions } from "../hooks/useActions";

export const SearchTracks: FC = () => {
    const [query, setQuery] = useState("");
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>();
    const { setLoading, setNewPlaylist } = useCurrentPlaylistActions();

    useEffect(() => {
        clearTimeout(timeoutId);
        let fn = () => {
            setLoading();
            // TODO: Здесь обработка ошибок должна быть.
            audioSearch(query, (tracks) => {
                setNewPlaylist(tracks);
            });
        }
        !query && !timeoutId ? fn() : setTimeoutId(setTimeout(fn, 500));
    }, [query]);

    return (
        <Search onChange={event => setQuery(event.target.value)} />
    );
};

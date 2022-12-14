import { Header, Link } from "@vkontakte/vkui";
import { FC } from "react";

import { ContentTab, ITitlePlaylist } from "../../../types";
import { useBlockPlaylistActions, useTabActions } from "../../hooks/useActions";

type Props = {
    playlist: ITitlePlaylist;
};

export const ShowAllTracksHeaderLink: FC<Props> = ({ playlist }) => {
    const { setTab } = useTabActions();
    const { setBlockId } = useBlockPlaylistActions();

    return (
        <Header
            mode="secondary"
            aside={playlist.tracks.length > 6 && (
                <Link
                    onClick={() => {
                        setBlockId(playlist);
                        setTab(ContentTab.BLOCK_PLAYLIST);
                    }}
                >
                    Показать все
                </Link>
            )}
        >
            {playlist.title}
        </Header>
    );
};

import { types } from "@vk-audiopad/common";
import { Header, Link } from "@vkontakte/vkui";
import { FC } from "react";

import { useBlockPlaylistActions, useTabActions } from "../../hooks/useActions";

type Props = {
    playlist: types.ITitlePlaylist;
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
                        setTab(types.ContentTab.BLOCK_PLAYLIST);
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

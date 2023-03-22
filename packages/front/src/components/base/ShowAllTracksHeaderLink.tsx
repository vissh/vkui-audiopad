import { storage, types } from "@vk-audiopad/common";
import { Header, Link } from "@vkontakte/vkui";
import { FC } from "react";

import { useTypedSelector } from "../../hooks/useTypedSelector";

type Props = {
    playlist: types.TypeTitlePlaylist;
};

export const ShowAllTracksHeaderLink: FC<Props> = ({ playlist }) => {
    const { userId } = useTypedSelector(state => state.application);

    const onClick = async () => {
        await storage.set({
            selectedTab: {
                tab: types.ContentTab.BLOCK_PLAYLIST,
                fromId: userId,
                playlist: playlist,
            },
        });
    };

    return (
        <Header
            mode="secondary"
            aside={playlist.tracks.length > 6 && (
                <Link onClick={onClick}>
                    Показать все
                </Link>
            )}
        >
            {playlist.title}
        </Header>
    );
};

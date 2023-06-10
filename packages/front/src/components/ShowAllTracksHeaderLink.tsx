import { baseEnums, baseTypes } from "@vk-audiopad/common";
import { Header, Link } from "@vkontakte/vkui";
import { FC } from "react";
import { useSetAtom } from "../core/atom";
import { selectedTabAtom } from "../core/atoms/storage";

type Props = {
    userId: string;
    playlist: baseTypes.TTitlePlaylist;
};

export const ShowAllTracksHeaderLink: FC<Props> = ({ userId, playlist }) => {
    const setSelectedTab = useSetAtom(selectedTabAtom);

    const onClick = () => {
        setSelectedTab({
            tab: baseEnums.EContentTab.BLOCK_PLAYLIST,
            fromId: userId,
            playlist: playlist,
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

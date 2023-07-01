import { baseEnums, baseTypes } from "@vk-audiopad/common";
import { Header, Link } from "@vkontakte/vkui";
import { FC } from "react";
import { useAtom } from "../core/atom";
import { selectedTabAtom } from "../core/atoms";
import { sendEventShowAllTracks } from "../core/top";

type Props = {
    userId: string;
    playlist: baseTypes.TTitlePlaylist;
};

export const ShowAllTracksHeaderLink: FC<Props> = ({ userId, playlist }) => {
    const [selectedTab, setSelectedTab] = useAtom(selectedTabAtom);

    const onClick = () => {
        setSelectedTab({
            tab: baseEnums.EContentTab.BLOCK_PLAYLIST,
            fromId: userId,
            playlist: playlist,
        });
        sendEventShowAllTracks(selectedTab.tab);
    };

    return (
        <Header
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

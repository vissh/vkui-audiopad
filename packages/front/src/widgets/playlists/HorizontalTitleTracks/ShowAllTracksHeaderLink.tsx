import { baseEnums, baseTypes } from "@vk-audiopad/common";
import { Header, Link } from "@vkontakte/vkui";
import { FC } from "react";
import { selectedTabAtom } from "shared/appAtoms";
import { sendEventShowAllTracks } from "shared/lib/analytics";
import { useAtom } from "shared/lib/atom";
import { newHistory } from "shared/lib/utils";

type ShowAllTracksHeaderLinkProps = {
    userId: string;
    playlist: baseTypes.TTitlePlaylist;
};

export const ShowAllTracksHeaderLink: FC<ShowAllTracksHeaderLinkProps> = ({ userId, playlist }) => {
    const [selectedTab, setSelectedTab] = useAtom(selectedTabAtom);

    const onClick = () => {
        setSelectedTab({
            tab: baseEnums.EContentTab.BLOCK_PLAYLIST,
            fromId: userId,
            playlist: playlist,
            history: newHistory(selectedTab),
        });

        sendEventShowAllTracks(selectedTab.tab);
    };

    return (
        <Header aside={playlist.tracks.length > 6 && <Link onClick={onClick}>Показать все</Link>}>
            {playlist.title}
        </Header>
    );
};

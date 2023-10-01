import { baseEnums } from "@vk-audiopad/common";
import { Group, Header, Link } from "@vkontakte/vkui";
import { FC } from "react";
import { selectedTabAtom } from "shared/appAtoms";
import { sendEventShowAllPlaylists } from "shared/lib/analytics";
import { useAtom } from "shared/lib/atom";
import { newHistory } from "shared/lib/utils";
import { TCoverPlaylist } from "shared/types";
import { HorizontalCoverPlaylists } from "../HorizontalCoverPlaylists";

type HorizontalTitleCoverPlaylistsProps = {
    userId: string;
    title: string;
    playlists: TCoverPlaylist[];
    showAllLink: string;
    showMore?: boolean;
};

export const HorizontalTitleCoverPlaylists: FC<HorizontalTitleCoverPlaylistsProps> = ({
    userId,
    title,
    playlists,
    showAllLink,
    showMore,
}) => {
    const [selectedTab, setSelectedTab] = useAtom(selectedTabAtom);

    const onClick = () => {
        setSelectedTab({
            tab: baseEnums.EContentTab.COVER_PLAYLISTS,
            title: title,
            showAllLink: showAllLink,
            history: newHistory(selectedTab),
        });

        sendEventShowAllPlaylists(selectedTab.tab);
    };

    return (
        <Group
            mode="plain"
            header={
                <Header aside={playlists.length > 5 && showMore && <Link onClick={onClick}>Показать все</Link>}>
                    {title}
                </Header>
            }
        >
            <HorizontalCoverPlaylists
                userId={userId}
                playlists={playlists}
            />
        </Group>
    );
};

import { baseEnums } from "@vk-audiopad/common";
import { Group, Header, Link } from "@vkontakte/vkui";
import { FC } from "react";
import { useSetAtom } from "../core/atom";
import { selectedTabAtom } from "../core/atoms";
import { TCoverPlaylist } from "../core/types/playlists";
import { HorizantalCoverPlaylists } from "./HorizontalCoverPlaylists";

type HorizontalTitleCoverPlaylistsProps = {
    userId: string;
    title: string;
    playlists: TCoverPlaylist[];
    showAllLink: string;
    showMore?: boolean;
};

export const HorizontalTitleCoverPlaylists: FC<HorizontalTitleCoverPlaylistsProps> = ({ userId, title, playlists, showAllLink, showMore }) => {
    const setSelectedTab = useSetAtom(selectedTabAtom);

    const onClick = () => {
        setSelectedTab({
            tab: baseEnums.EContentTab.COVER_PLAYLISTS,
            showAllLink: showAllLink,
        });
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
            <HorizantalCoverPlaylists
                userId={userId}
                playlists={playlists}
            />
        </Group>
    )
};

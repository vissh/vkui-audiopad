import { baseEnums, baseTypes } from "@vk-audiopad/common";
import { Group, Header, Link } from "@vkontakte/vkui";
import { FC } from "react";
import { useSetAtom } from "../core/atom";
import { selectedTabAtom } from "../core/atoms/storage";
import { HorizantalCoverPlaylists } from "./HorizontalCoverPlaylists";

type HorizontalTitleCoverPlaylistsProps = {
    userId: string;
    title: string;
    playlists: baseTypes.TCoverPlaylist[];
    showMore?: boolean;
};

export const HorizontalTitleCoverPlaylists: FC<HorizontalTitleCoverPlaylistsProps> = ({ userId, title, playlists, showMore }) => {
    const setSelectedTab = useSetAtom(selectedTabAtom);

    const onClick = () => {
        setSelectedTab({
            tab: baseEnums.EContentTab.COVER_PLAYLISTS,
            fromId: userId,
        });
    };

    return (
        <Group
            mode="plain"
            separator="hide"
            header={
                <Header
                    mode="secondary"
                    aside={playlists.length > 6 && showMore && <Link onClick={onClick}>Показать все</Link>}
                >
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

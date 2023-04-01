import { storage, types } from "@vk-audiopad/common";
import { Group, Header, Link } from "@vkontakte/vkui";
import { FC } from "react";
import { useTypedSelector } from "../../hooks/useTypedSelector";
import { HorizantalCoverPlaylists } from "./HorizontalCoverPlaylists";

type HorizontalTitleCoverPlaylistsProps = {
    title: string;
    playlists: types.TypeCoverPlaylist[];
    showMore?: boolean;
};

export const HorizontalTitleCoverPlaylists: FC<HorizontalTitleCoverPlaylistsProps> = ({ title, playlists, showMore }) => {
    const { userId } = useTypedSelector(state => state.application);

    const onClick = async () => {
        await storage.set({
            selectedTab: {
                tab: types.ContentTab.COVER_PLAYLISTS,
                fromId: userId,
            },
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
            <HorizantalCoverPlaylists playlists={playlists} />
        </Group>
    )
};

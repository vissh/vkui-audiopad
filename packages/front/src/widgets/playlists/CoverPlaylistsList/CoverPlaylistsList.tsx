import { utils } from "@vk-audiopad/common";
import { List } from "@vkontakte/vkui";
import { FC } from "react";
import { TCoverPlaylist } from "shared/types";
import { HorizontalCoverPlaylists } from "widgets/playlists";

type CoverPlaylistsListProps = {
    userId: string;
    coverPlaylists: TCoverPlaylist[];
};

export const CoverPlaylistsList: FC<CoverPlaylistsListProps> = ({ userId, coverPlaylists }) => {
    const columnsPlaylists: TCoverPlaylist[][] = Array.from(utils.chunked(coverPlaylists, 5));

    return (
        <List>
            {columnsPlaylists.map((playlists) => (
                <HorizontalCoverPlaylists
                    userId={userId}
                    playlists={playlists}
                />
            ))}
        </List>
    );
};

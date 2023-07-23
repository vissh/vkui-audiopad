import { HorizontalScroll } from "@vkontakte/vkui";
import { FC } from "react";
import { TCoverPlaylist } from "shared/types";
import { PlaylistCell } from "./PlaylistCell";

type HorizontalCoverPlaylistsProps = {
    userId: string;
    playlists: TCoverPlaylist[];
};

export const HorizontalCoverPlaylists: FC<HorizontalCoverPlaylistsProps> = ({ userId, playlists }) => {
    return (
        <HorizontalScroll>
            <div style={{ display: "flex" }}>
                {playlists.map((playlist) => (
                    <PlaylistCell
                        userId={userId}
                        playlist={playlist}
                    />
                ))}
            </div>
        </HorizontalScroll>
    );
};

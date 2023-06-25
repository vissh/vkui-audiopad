import { Group } from "@vkontakte/vkui";
import { FC } from "react";
import { EPlaylistDataType } from "../core/types/enums";
import { TPlaylistBlock } from "../core/types/playlists";
import "./Artist.css";
import { HorizontalTitleCoverPlaylists } from "./HorizontalTitleCoverPlaylists";
import { HorizantalTitleTracks } from "./HorizontalTitleTracks";

type Props = {
    userId: string;
    playlistBlock: TPlaylistBlock;
    wrapGroup: boolean;
};

export const HorizontalPlaylist: FC<Props> = ({ userId, playlistBlock, wrapGroup }) => {
    const node = playlistBlock.dataType === EPlaylistDataType.TRACKS
        ? (
            <HorizantalTitleTracks
                userId={userId}
                playlist={playlistBlock.playlist} />
        )
        : (
            <HorizontalTitleCoverPlaylists
                title={playlistBlock.title}
                userId={userId}
                playlists={playlistBlock.playlists}
                showAllLink={playlistBlock.showAllLink}
                showMore={!!playlistBlock.showAllLink}
            />
        )

    return wrapGroup ? <Group>{node}</Group> : node;
};

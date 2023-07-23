import { Group } from "@vkontakte/vkui";
import { FC } from "react";
import { EPlaylistDataType, TPlaylistBlock } from "shared/types";
import { HorizontalTitleCoverPlaylists } from "../HorizontalTitleCoverPlaylists";
import { HorizontalTitleTracks } from "../HorizontalTitleTracks";

type HorizontalPlaylistProps = {
    userId: string;
    playlistBlock: TPlaylistBlock;
    wrapGroup: boolean;
};

export const HorizontalPlaylist: FC<HorizontalPlaylistProps> = ({ userId, playlistBlock, wrapGroup }) => {
    const node =
        playlistBlock.dataType === EPlaylistDataType.TRACKS ? (
            <HorizontalTitleTracks
                userId={userId}
                playlist={playlistBlock.playlist}
            />
        ) : (
            <HorizontalTitleCoverPlaylists
                title={playlistBlock.title}
                userId={userId}
                playlists={playlistBlock.playlists}
                showAllLink={playlistBlock.showAllLink}
                showMore={!!playlistBlock.showAllLink}
            />
        );

    return wrapGroup ? <Group>{node}</Group> : node;
};

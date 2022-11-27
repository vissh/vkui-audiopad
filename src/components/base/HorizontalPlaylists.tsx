import { Avatar, GridAvatar, HorizontalCell, HorizontalScroll } from "@vkontakte/vkui";
import { FC } from "react";

import { ICoverPlaylist } from "../../types";

type HorizontalPlailistsProps = {
    playlists: ICoverPlaylist[];
    useGridCovers: boolean;
};

export const HorizantalPlaylists: FC<HorizontalPlailistsProps> = ({ playlists, useGridCovers }) => {

    return (
        <HorizontalScroll>
            <div style={{ display: "flex" }}>
                {playlists.map(playlist => (
                    <HorizontalCell
                        size="l"
                        header={
                            <span style={{ display: "inline-block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "14ch" }}>
                                {playlist.title}
                            </span>
                        }
                        subtitle={
                            <span style={{ display: "inline-block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "14ch" }}>
                                {playlist.authorName}
                            </span>
                        }
                    >
                        {useGridCovers ? (
                            <GridAvatar
                                size={96}
                                src={playlist.gridCoverUrls}
                            />)
                            : <Avatar
                                size={96}
                                mode="image"
                                src={playlist.coverUrl}
                            />}

                    </HorizontalCell>
                ))}
            </div>
        </HorizontalScroll>
    );
};

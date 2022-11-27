import { Avatar, HorizontalCell, HorizontalScroll } from "@vkontakte/vkui";
import { FC } from "react";

import { ICoverPlaylist } from "../../types";

type HorizontalPlailistsProps = {
    playlists: ICoverPlaylist[];
};

export const HorizantalPlaylists: FC<HorizontalPlailistsProps> = ({ playlists }) => {

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
                        <Avatar // TODO: GridAvatar или что-то подобное. Для ручных поейлистов бывает несколько коверов.
                            size={96}
                            mode="image"
                            src={playlist.coverUrl}
                        />

                    </HorizontalCell>
                ))}
            </div>
        </HorizontalScroll>
    );
};

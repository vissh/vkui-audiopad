import { Avatar, HorizontalCell, HorizontalScroll } from "@vkontakte/vkui";
import { CSSProperties, FC } from "react";

import { ICoverPlaylist } from "../../../types";

type Props = {
    playlists: ICoverPlaylist[];
};

export const HorizantalPlaylists: FC<Props> = ({ playlists }) => {

    const truncateTextStyle: CSSProperties = {
        display: "inline-block",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "14ch",
    };

    return (
        <HorizontalScroll>
            <div style={{ display: "flex" }}>
                {playlists.map(playlist => (
                    <HorizontalCell
                        size="l"
                        header={
                            <span style={truncateTextStyle}>
                                {playlist.title}
                            </span>
                        }
                        subtitle={
                            <span style={truncateTextStyle}>
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

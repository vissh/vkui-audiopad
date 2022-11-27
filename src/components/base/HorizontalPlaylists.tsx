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
                        header={playlist.title} // TODO: здесь надо сократить количество символов.
                        subtitle={playlist.authorName} // TODO: здесь бы тоже.
                    >
                        <Avatar
                            size={128}
                            mode="image"
                            src={playlist.coverUrl}
                        />
                    </HorizontalCell>
                ))}
            </div>
        </HorizontalScroll>
    );
};

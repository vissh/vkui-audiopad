import { types } from "@vk-audiopad/common";
import { HorizontalCell, HorizontalScroll, Image } from "@vkontakte/vkui";
import { CSSProperties, FC } from "react";

import { useBlockPlaylistActions, useTabActions } from "../../hooks/useActions";


type Props = {
    playlists: types.ICoverPlaylist[];
};

export const HorizantalPlaylists: FC<Props> = ({ playlists }) => {
    const { setTab } = useTabActions();
    const { setBlockId } = useBlockPlaylistActions();

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
                        onClick={() => {
                            setBlockId(playlist);
                            setTab(types.ContentTab.BLOCK_PLAYLIST);
                        }}
                    >
                        {/* TODO: GridAvatar или что-то подобное. Для ручных поейлистов бывает несколько коверов. */}
                        <Image
                            src={playlist.coverUrl}
                            size={96} />

                    </HorizontalCell>
                ))}
            </div>
        </HorizontalScroll>
    );
};

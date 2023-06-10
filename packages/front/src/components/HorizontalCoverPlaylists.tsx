import { baseEnums, baseTypes } from "@vk-audiopad/common";
import { Icon36PlaylistOutline } from "@vkontakte/icons";
import { HorizontalCell, HorizontalScroll, Image } from "@vkontakte/vkui";
import { CSSProperties, FC } from "react";
import { useSetAtom } from "../core/atom";
import { selectedTabAtom } from "../core/atoms/storage";

type Props = {
    userId: string;
    playlists: baseTypes.TCoverPlaylist[];
};

export const HorizantalCoverPlaylists: FC<Props> = ({ userId, playlists }) => {
    const setSelectedTab = useSetAtom(selectedTabAtom);

    const truncateTextStyle: CSSProperties = {
        display: "inline-block",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "18ch",
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
                            setSelectedTab({
                                tab: baseEnums.EContentTab.BLOCK_PLAYLIST,
                                fromId: userId,
                                playlist: playlist,
                            });
                        }}
                    >
                        {/* TODO: GridAvatar или что-то подобное. Для ручных плейлистов бывает несколько коверов. */}
                        {playlist.coverUrl
                            ? <Image
                                src={playlist.coverUrl}
                                loading={"lazy"}
                                size={136} />
                            : <Image size={136}><Icon36PlaylistOutline /></Image>
                        }

                    </HorizontalCell>
                ))}
            </div>
        </HorizontalScroll>
    );
};

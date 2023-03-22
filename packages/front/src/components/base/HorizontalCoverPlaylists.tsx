import { storage, types } from "@vk-audiopad/common";
import { Icon36PlaylistOutline } from "@vkontakte/icons";
import { HorizontalCell, HorizontalScroll, Image } from "@vkontakte/vkui";
import { CSSProperties, FC } from "react";

import { useTypedSelector } from "../../hooks/useTypedSelector";

type Props = {
    playlists: types.TypeCoverPlaylist[];
};

export const HorizantalCoverPlaylists: FC<Props> = ({ playlists }) => {
    const { userId } = useTypedSelector(state => state.application);

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
                        onClick={async () => {
                            await storage.set({
                                selectedTab: {
                                    tab: types.ContentTab.BLOCK_PLAYLIST,
                                    fromId: userId,
                                    playlist: playlist,
                                }
                            });
                        }}
                    >
                        {/* TODO: GridAvatar или что-то подобное. Для ручных поейлистов бывает несколько коверов. */}
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

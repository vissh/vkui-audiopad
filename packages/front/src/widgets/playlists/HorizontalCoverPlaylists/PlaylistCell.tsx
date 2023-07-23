import { baseEnums, baseTypes } from "@vk-audiopad/common";
import { Icon36PlaylistOutline } from "@vkontakte/icons";
import { HorizontalCell, Image } from "@vkontakte/vkui";
import { FC } from "react";
import { selectedTabAtom } from "shared/appAtoms";
import { sendEventOpenCoverPlaylist } from "shared/lib/analytics";
import { useAtom } from "shared/lib/atom";
import { TCoverPlaylist } from "shared/types";
import { OverlayActions } from "./OverlayActions";
import "./PlaylistCell.css";

type PlaylistCellProps = {
    userId: string;
    playlist: TCoverPlaylist;
};

export const PlaylistCell: FC<PlaylistCellProps> = ({ userId, playlist }) => {
    const [selectedTab, setSelectedTab] = useAtom(selectedTabAtom);

    const openPlaylist = (playlist: baseTypes.TTitlePlaylist) => () => {
        setSelectedTab({
            tab: baseEnums.EContentTab.BLOCK_PLAYLIST,
            fromId: userId,
            playlist: playlist,
        });
        sendEventOpenCoverPlaylist(selectedTab.tab);
    };

    return (
        <HorizontalCell
            size="l"
            header={<span className="vkap_subtitle">{playlist.title}</span>}
            subtitle={<span className="vkap_subtitle">{playlist.authorName}</span>}
            extraSubtitle={!!playlist.infoLine && <span className="vkap_subtitle">{playlist.infoLine}</span>}
            onClick={openPlaylist(playlist)}
        >
            {/* TODO: GridAvatar или что-то подобное. Для ручных плейлистов бывает несколько коверов. */}
            {playlist.coverUrl ? (
                <Image
                    src={playlist.coverUrl}
                    loading={"lazy"}
                    size={136}
                >
                    <OverlayActions
                        userId={userId}
                        playlist={playlist}
                    />
                </Image>
            ) : (
                <Image size={136}>
                    <Icon36PlaylistOutline />
                </Image>
            )}
        </HorizontalCell>
    );
};

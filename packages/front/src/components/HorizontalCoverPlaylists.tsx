import { baseEnums, baseTypes } from "@vk-audiopad/common";
import { Icon36Add, Icon36Done, Icon36Pause, Icon36Play, Icon36PlaylistOutline } from "@vkontakte/icons";
import { HorizontalCell, HorizontalScroll, Image, Separator } from "@vkontakte/vkui";
import { FC, useState } from "react";
import { actions } from "../core/actions";
import { useAtom, useAtomValue } from "../core/atom";
import { currentPlaylistAtom, playedAtom, selectedTabAtom } from "../core/atoms";
import { fetchFollowPlaylist } from "../core/fetchers/followPlaylist";
import { fetchPlaylist } from "../core/fetchers/playlist";
import { sendEventFollowCoverPlaylist, sendEventOpenCoverPlaylist, sendEventPauseCoverPlaylist, sendEventPlayCoverPlaylist, sendEventResumeCoverPlaylist, sendEventUnfollowCoverPlaylist } from "../core/top";
import { TCoverPlaylist } from "../core/types/playlists";
import "./HorizontalCoverPlaylists.css";

type Props = {
    userId: string;
    playlists: TCoverPlaylist[];
};

export const HorizantalCoverPlaylists: FC<Props> = ({ userId, playlists }) => {
    return (
        <HorizontalScroll>
            <div style={{ display: "flex" }}>
                {playlists.map((playlist) => <PlaylistCell userId={userId} playlist={playlist} />)}
            </div>
        </HorizontalScroll>
    );
};

type PlaylistCellProps = {
    userId: string;
    playlist: TCoverPlaylist;
};

const PlaylistCell: FC<PlaylistCellProps> = ({ userId, playlist }) => {
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
            {playlist.coverUrl
                ? <Image
                    src={playlist.coverUrl}
                    loading={"lazy"}
                    size={136}
                >
                    <OverlayActions userId={userId} playlist={playlist} />
                </Image>
                : <Image size={136}><Icon36PlaylistOutline /></Image>
            }
        </HorizontalCell>
    );
};

type OverlayActionsProps = {
    userId: string;
    playlist: TCoverPlaylist;
};

const OverlayActions: FC<OverlayActionsProps> = ({ userId, playlist }) => {
    const selectedTab = useAtomValue(selectedTabAtom);
    const currentPlaylist = useAtomValue(currentPlaylistAtom);
    const [played, setPlayed] = useAtom(playedAtom);

    const [followed, setFollowed] = useState(playlist.isFollowed);

    const followPlaylist = (playlist: baseTypes.TTitlePlaylist) => async (e: any) => {
        e.stopPropagation();
        const followed = !!await fetchFollowPlaylist(playlist)
        setFollowed(followed);

        followed
            ? sendEventFollowCoverPlaylist(selectedTab.tab)
            : sendEventUnfollowCoverPlaylist(selectedTab.tab);
    };

    const playPlaylist = (playlist: baseTypes.TTitlePlaylist) => async (e: any) => {
        e.stopPropagation();
        const playlistFetchResult = await fetchPlaylist({ fromId: userId, playlist: playlist });
        actions.activeTrack(0, playlistFetchResult.playlist);
        sendEventPlayCoverPlaylist(selectedTab.tab);
    };

    const playPausePlaylist = (e: any) => {
        e.stopPropagation();
        setPlayed(!played);
        played
            ? sendEventPauseCoverPlaylist(selectedTab.tab)
            : sendEventResumeCoverPlaylist(selectedTab.tab);
    };

    return (
        <Image.Overlay theme="dark">
            <>
                {!!playlist.followHash &&
                    (followed
                        ? <Icon36Done className="cover_pl_act_btn" onClick={followPlaylist(playlist)} />
                        : <Icon36Add className="cover_pl_act_btn" onClick={followPlaylist(playlist)} />)}

                <Separator />

                {currentPlaylist && currentPlaylist.id === playlist.id
                    ? (played
                        ? <Icon36Pause className="cover_pl_act_btn" onClick={playPausePlaylist} />
                        : <Icon36Play className="cover_pl_act_btn" onClick={playPausePlaylist} />)
                    : <Icon36Play className="cover_pl_act_btn" onClick={playPlaylist(playlist)} />
                }
            </>
        </Image.Overlay>
    );
};

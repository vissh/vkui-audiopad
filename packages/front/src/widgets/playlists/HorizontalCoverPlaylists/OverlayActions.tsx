import { baseTypes } from "@vk-audiopad/common";
import { Icon36Add, Icon36Done, Icon36Pause, Icon36Play } from "@vkontakte/icons";
import { Image, Separator } from "@vkontakte/vkui";
import { FC, useState } from "react";
import { fetchFollowPlaylist, fetchPlaylist } from "shared/api";
import { currentPlaylistAtom, playedAtom, selectedTabAtom } from "shared/appAtoms";
import { actions } from "shared/lib/actions";
import {
    sendEventFollowCoverPlaylist,
    sendEventPauseCoverPlaylist,
    sendEventPlayCoverPlaylist,
    sendEventResumeCoverPlaylist,
    sendEventUnfollowCoverPlaylist,
} from "shared/lib/analytics";
import { useAtom, useAtomValue } from "shared/lib/atom";
import { TCoverPlaylist } from "shared/types";
import "./OverlayActions.css";

type OverlayActionsProps = {
    userId: string;
    playlist: TCoverPlaylist;
};

export const OverlayActions: FC<OverlayActionsProps> = ({ userId, playlist }) => {
    const selectedTab = useAtomValue(selectedTabAtom);
    const currentPlaylist = useAtomValue(currentPlaylistAtom);
    const [played, setPlayed] = useAtom(playedAtom);

    const [followed, setFollowed] = useState(playlist.isFollowed);

    const followPlaylist = (playlist: baseTypes.TTitlePlaylist) => async (e: any) => {
        e.stopPropagation();
        const followed = !!(await fetchFollowPlaylist(playlist));
        setFollowed(followed);

        followed ? sendEventFollowCoverPlaylist(selectedTab.tab) : sendEventUnfollowCoverPlaylist(selectedTab.tab);
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
        played ? sendEventPauseCoverPlaylist(selectedTab.tab) : sendEventResumeCoverPlaylist(selectedTab.tab);
    };

    return (
        <Image.Overlay theme="dark">
            <>
                {!!playlist.followHash &&
                    (followed ? (
                        <Icon36Done
                            className="cover_pl_act_btn"
                            onClick={followPlaylist(playlist)}
                        />
                    ) : (
                        <Icon36Add
                            className="cover_pl_act_btn"
                            onClick={followPlaylist(playlist)}
                        />
                    ))}

                <Separator />

                {currentPlaylist && currentPlaylist.id === playlist.id ? (
                    played ? (
                        <Icon36Pause
                            className="cover_pl_act_btn"
                            onClick={playPausePlaylist}
                        />
                    ) : (
                        <Icon36Play
                            className="cover_pl_act_btn"
                            onClick={playPausePlaylist}
                        />
                    )
                ) : (
                    <Icon36Play
                        className="cover_pl_act_btn"
                        onClick={playPlaylist(playlist)}
                    />
                )}
            </>
        </Image.Overlay>
    );
};

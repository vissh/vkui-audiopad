import "@vkontakte/vkui/dist/vkui.css";

import { api, storage, types, utils } from "@vk-audiopad/common";
import { Icon28SongOutline, Icon32PauseCircle, Icon32PlayCircle } from "@vkontakte/icons";
import { Image, SimpleCell } from "@vkontakte/vkui";
import React, { FC } from "react";

import { useTypedSelector } from "../../hooks/useTypedSelector";
import { Artist } from "./Artist";
import { Duration } from "./Duration";

type Props = {
    playlist: types.TypeTitlePlaylist;
    track: types.TypeTrackItem;
};

export const Track: FC<Props> = ({ playlist, track }) => {
    const { activeTrack, played } = useTypedSelector(state => state.application);

    const isActive = Boolean(activeTrack && activeTrack.id === track.id);
    const isPlayed = Boolean(isActive && played);

    const trackOnClick = async () => {
        if (activeTrack && activeTrack.id === track.id) {
            await storage.set({ played: !isPlayed });
        } else {
            api.activeTrack(track, playlist);
        }
    };

    const isClaimed = !!(track.flags & types.EAudioFlagBit.CLAIMED);

    return (
        <SimpleCell
            disabled={isClaimed}
            onClick={trackOnClick}
            before={
                <Image
                    src={track.image}
                    loading={"lazy"}
                >
                    {!isClaimed && (
                        <Image.Overlay theme="dark" visibility={isActive ? "always" : "on-hover"}>
                            {isPlayed
                                ? <Icon32PauseCircle width={32} height={32} fill={"white"} />
                                : <Icon32PlayCircle width={32} height={32} fill={"white"} />}
                        </Image.Overlay>
                    )}
                    {isClaimed && (
                        <Image.Overlay theme="light" visibility="always">
                            <React.Fragment></React.Fragment>
                        </Image.Overlay>
                    )}
                    {!track.image && <Icon28SongOutline />}
                </Image>
            }
            after={<Duration value={track.duration && !isClaimed ? utils.toHHMMSS(track.duration) : ""} />}
            subtitle={<Artist value={track.artist} />}
        >
            {isClaimed
                ? <span style={{ color: "var(--vkui--color_text_secondary)" }}>{track.title}</span>
                : track.title}
        </SimpleCell>
    );
};

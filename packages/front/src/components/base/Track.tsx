import { api, storage, types, utils } from "@vk-audiopad/common";
import { Icon28SongOutline, Icon32PauseCircle, Icon32PlayCircle } from "@vkontakte/icons";
import { Image, Separator, SimpleCell } from "@vkontakte/vkui";
import "@vkontakte/vkui/dist/vkui.css";
import React, { FC } from "react";
import { useTypedSelector } from "../../hooks/useTypedSelector";
import { Artist } from "./Artist";
import { Duration } from "./Duration";

type Props = {
    playlist: types.TypeTitlePlaylist;
    track: types.TypeTrackItem;
    trackIndex: number;
};

export const Track: FC<Props> = ({ playlist, track, trackIndex }) => {
    const { activeTrack, played } = useTypedSelector(state => state.application);

    const isActive = Boolean(activeTrack && activeTrack.id === track.id);
    const isPlayed = Boolean(isActive && played);

    const trackOnClick = async () => {
        if (activeTrack && activeTrack.id === track.id) {
            await storage.set({ played: !isPlayed });
        } else {
            api.activeTrack(trackIndex, playlist);
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
            after={
                <React.Fragment>
                    <Separator />
                    <Duration value={track.duration && !isClaimed ? utils.toHHMMSS(track.duration) : ""} />
                </React.Fragment>}
            subtitle={<Artist value={track.artist} />}
        >
            {isClaimed
                ? <span style={{ color: "var(--vkui--color_text_secondary)" }}>{track.title}</span>
                : track.title}
        </SimpleCell>
    );
};

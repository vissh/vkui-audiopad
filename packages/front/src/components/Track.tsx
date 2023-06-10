import { baseEnums, baseTypes, utils } from "@vk-audiopad/common";
import { Icon20More, Icon28SongOutline, Icon32PauseCircle, Icon32PlayCircle } from "@vkontakte/icons";
import { Cell, IconButton, Image, Separator } from "@vkontakte/vkui";
import React, { FC, useState } from "react";
import { actions } from "../core/actions";
import { useAtom, useAtomValue, useSetAtom } from "../core/atom";
import { popoutAtom } from "../core/atoms/popout";
import { activeTrackAtom, playedAtom, userIdAtom } from "../core/atoms/storage";
import { Artist } from "./Artist";
import { Duration } from "./Duration";
import { TrackActions } from "./TrackActions";

type Props = {
    playlist: baseTypes.TTitlePlaylist;
    track: baseTypes.TTrackItem;
    trackIndex: number;
    draggable?: boolean;
    onDragFinish?: ({ from, to }: { from: number, to: number }) => void;
    onRemove?: (index: number) => void;
};

export const Track: FC<Props> = ({ playlist, track, trackIndex, draggable, onDragFinish, onRemove }) => {
    const userId = useAtomValue(userIdAtom);
    const activeTrack = useAtomValue(activeTrackAtom);
    const [played, setPlayed] = useAtom(playedAtom);
    const setPopout = useSetAtom(popoutAtom);

    const originalTrack = track;
    const isOwner = track.id.split("_")[0] === userId;

    var [track, setTrack] = useState(track);

    const isActive = Boolean(activeTrack && activeTrack.id === track.id);
    const isPlayed = Boolean(isActive && played);
    const isClaimed = !!(track.flags & baseEnums.EAudioFlagBit.CLAIMED);

    const moreTargetRef = React.useRef<HTMLButtonElement>(null);

    const trackOnClick = async () => {
        if (activeTrack && activeTrack.id === track.id) {
            setPlayed(!isPlayed);
        } else {
            actions.activeTrack(trackIndex, playlist);
        }
    };

    const onMoreButtonClick = (e: any) => {
        e.stopPropagation();
        setPopout(
            <TrackActions
                track={track}
                updateTrack={(newTrack) => setTrack(newTrack)}
                deleteTrack={(newTrack) => isOwner ? setTrack(newTrack) : setTrack(originalTrack)}
                toggleRef={moreTargetRef}
            />
        );
    };

    return (
        <Cell
            draggable={draggable}
            mode={draggable ? "removable" : undefined}
            onDragFinish={onDragFinish}
            onRemove={() => onRemove && onRemove(trackIndex)}
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
                            <></>
                        </Image.Overlay>
                    )}
                    {!track.image && <Icon28SongOutline />}
                </Image>
            }
            after={
                !isClaimed && (
                    <>
                        <Separator />
                        <Duration value={track.duration && !isClaimed ? utils.toHHMMSS(track.duration) : ""} />
                        {!playlist.isRadio &&
                            <IconButton
                                getRootRef={moreTargetRef}
                                style={{ marginLeft: "12px" }}
                                onClick={onMoreButtonClick}
                            >
                                <Icon20More />
                            </IconButton>
                        }
                    </>
                )
            }
            subtitle={<Artist value={track.artist} />}
        >
            {isClaimed
                ? <span style={{ color: "var(--vkui--color_text_secondary)" }}>{track.title}</span>
                : track.title}
        </Cell>
    );
};

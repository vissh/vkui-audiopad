import { baseEnums, baseTypes, utils } from "@vk-audiopad/common";
import { Icon20More, Icon28SongOutline, Icon32PauseCircle, Icon32PlayCircle } from "@vkontakte/icons";
import { Cell, IconButton, Image, Separator } from "@vkontakte/vkui";
import { useAtom, useAtomValue, useSetAtom } from "shared/lib/atom";
import React, { FC, useState } from "react";
import { activeTrackAtom, playedAtom, popoutAtom, selectedTabAtom, userIdAtom } from "shared/appAtoms";
import { actions } from "shared/lib/actions";
import { sendEventPauseTrack, sendEventPlayTrack, sendEventResumeTrack } from "shared/lib/analytics";
import { Duration, SearchArtistTitle } from "shared/ui/components";
import { TrackActions } from "./TrackActions";

type TrackProps = {
    playlist: baseTypes.TTitlePlaylist;
    track: baseTypes.TTrackItem;
    trackIndex: number;
    editMode?: boolean;
    onDragFinish?: ({ from, to }: { from: number; to: number }) => void;
    onRemove?: (index: number) => void;
};

export const Track: FC<TrackProps> = ({ playlist, track, trackIndex, editMode, onDragFinish, onRemove }) => {
    const userId = useAtomValue(userIdAtom);
    const activeTrack = useAtomValue(activeTrackAtom);
    const selectedTab = useAtomValue(selectedTabAtom);
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
            isPlayed ? sendEventPauseTrack(selectedTab.tab) : sendEventResumeTrack(selectedTab.tab);
        } else {
            actions.activeTrack(trackIndex, playlist);
            sendEventPlayTrack(selectedTab.tab);
        }
    };

    const onMoreButtonClick = (e: any) => {
        e.stopPropagation();
        setPopout(
            <TrackActions
                track={track}
                updateTrack={(newTrack) => setTrack(newTrack)}
                deleteTrack={(newTrack) => (isOwner ? setTrack(newTrack) : setTrack(originalTrack))}
                toggleRef={moreTargetRef}
            />,
        );
    };

    return (
        <Cell
            draggable={editMode}
            mode={editMode ? "removable" : undefined}
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
                        <Image.Overlay
                            theme="dark"
                            visibility={isActive ? "always" : "on-hover"}
                        >
                            {isPlayed ? (
                                <Icon32PauseCircle
                                    width={32}
                                    height={32}
                                    fill={"white"}
                                />
                            ) : (
                                <Icon32PlayCircle
                                    width={32}
                                    height={32}
                                    fill={"white"}
                                />
                            )}
                        </Image.Overlay>
                    )}
                    {isClaimed && (
                        <Image.Overlay
                            theme="light"
                            visibility="always"
                        >
                            <></>
                        </Image.Overlay>
                    )}
                    {!track.image && <Icon28SongOutline />}
                </Image>
            }
            after={
                !editMode &&
                !isClaimed && (
                    <>
                        <Separator />
                        <Duration value={track.duration && !isClaimed ? utils.toHHMMSS(track.duration) : ""} />
                        {!playlist.isRadio && (
                            <IconButton
                                getRootRef={moreTargetRef}
                                style={{ marginLeft: "12px" }}
                                onClick={onMoreButtonClick}
                            >
                                <Icon20More />
                            </IconButton>
                        )}
                    </>
                )
            }
            subtitle={<SearchArtistTitle track={track} />}
        >
            {isClaimed ? (
                <span style={{ color: "var(--vkui--color_text_secondary)" }}>{track.title}</span>
            ) : (
                track.title
            )}
        </Cell>
    );
};

import { baseTypes, utils } from "@vk-audiopad/common";
import { Group, HorizontalScroll, List } from "@vkontakte/vkui";
import { FC } from "react";
import { Track } from "widgets/track";
import { ShowAllLink } from "./ShowAllLink";

type TrackGalleryProps = {
    mode: "plain" | "card";
    userId: string;
    playlist: baseTypes.TTitlePlaylist;
};

export const TrackGallery: FC<TrackGalleryProps> = ({ mode, userId, playlist }) => {
    const rows = 3;
    const columns = 6;
    const columnsTracks = Array.from(
        utils.chunked(
            playlist.tracks.map((track, index) => [track, index]),
            rows,
            columns,
        ),
    );

    return (
        <Group
            mode={mode}
            header={
                <ShowAllLink
                    userId={userId}
                    playlist={playlist}
                />
            }
        >
            <HorizontalScroll>
                <div style={{ display: "flex" }}>
                    {columnsTracks.map((tracksWithIndexes) => (
                        <List style={{ width: 354, minWidth: 354 }}>
                            {tracksWithIndexes.map(([track, index]) => (
                                <Track
                                    key={track.id}
                                    playlist={playlist}
                                    track={track}
                                    trackIndex={index}
                                />
                            ))}
                        </List>
                    ))}
                </div>
            </HorizontalScroll>
        </Group>
    );
};

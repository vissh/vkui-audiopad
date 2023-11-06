import { Group, Headline } from "@vkontakte/vkui";
import { CurrentTimeSlider } from "features/change-current-time";
import { SearchArtist } from "features/search-artist";
import { FC } from "react";
import { useAtomValue } from "shared/lib/atom";
import { activeTrackAtom, currentPlaylistAtom } from "shared/model/storage-atoms";

const maxTitleChars = 23;

export const CurrentTrackInfo: FC = () => {
    const activeTrack = useAtomValue(activeTrackAtom);
    const currentPlaylist = useAtomValue(currentPlaylistAtom);

    let titleStyle = {};

    const title = (activeTrack?.title || "").trim();

    if (!currentPlaylist?.isRadio && title.length >= maxTitleChars) {
        titleStyle = {
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: maxTitleChars - 5 + "ch",
        };
    }

    return (
        <Group mode="plain">
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "flex-start", alignItems: "center" }}>
                {activeTrack ? (
                    <>
                        <Headline
                            level="1"
                            style={titleStyle}
                        >
                            {title}
                        </Headline>
                        <Headline>&ensp;–&ensp;</Headline>
                        <SearchArtist track={activeTrack} />
                    </>
                ) : (
                    <Headline
                        level="1"
                        style={titleStyle}
                    >
                        &ensp;
                    </Headline>
                )}
            </div>
            <CurrentTimeSlider />
        </Group>
    );
};

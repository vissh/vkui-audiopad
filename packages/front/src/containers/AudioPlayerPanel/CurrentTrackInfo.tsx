import { Group, Headline } from "@vkontakte/vkui";
import { CSSProperties, FC } from "react";
import { Artist } from "../../components/Artist";
import { useAtomValue } from "../../core/atom";
import { activeTrackAtom, currentPlaylistAtom } from "../../core/atoms/storage";
import { CurrentTimeSlider } from "./sliders/CurrentTimeSlider";

const maxTitleChars = 23;

export const CurrentTrackInfo: FC = () => {
    const activeTrack = useAtomValue(activeTrackAtom);
    const currentPlaylist = useAtomValue(currentPlaylistAtom);

    let titleStyle: CSSProperties = {};

    const title = (activeTrack?.title || "").trim();

    if (!currentPlaylist?.isRadio && title.length >= maxTitleChars) {
        titleStyle = {
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: (maxTitleChars - 5) + "ch",
        }
    }

    return (
        <Group mode="plain" separator="hide">
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "flex-start", alignItems: "center" }}>
                {activeTrack
                    ? <>
                        <Headline level="1" style={titleStyle}>{title}</Headline>
                        {activeTrack?.artist && (
                            <>
                                <Headline>&ensp;–&ensp;</Headline>
                                <Artist value={activeTrack?.artist} />
                            </>
                        )}
                    </>
                    : <Headline level="1" style={titleStyle}>&ensp;</Headline>
                }
            </div>
            <CurrentTimeSlider />
        </Group>
    )
};

import { Group, Headline } from "@vkontakte/vkui";
import { useAtomValue } from "shared/lib/atom";
import { CSSProperties, FC } from "react";
import { activeTrackAtom, currentPlaylistAtom } from "shared/appAtoms";
import { SearchArtistTitle } from "shared/ui/components";
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
                        <SearchArtistTitle
                            track={activeTrack}
                            context={"controls"}
                        />
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

import { Group, Headline } from "@vkontakte/vkui";
import { CSSProperties, FC } from "react";

import { useTypedSelector } from "../../../hooks/useTypedSelector";
import { Artist } from "../../base/Artist";
import { CurrentTimeSlider } from "./CurrentTimeSlider";

export const CurrentTrack: FC = () => {
    const { activeTrack } = useTypedSelector(state => state.application);

    const maxTitleChars = 26;

    let titleStyle: CSSProperties = {};

    const title = (activeTrack?.title || "").trim();

    if (title.length >= maxTitleChars) {
        titleStyle = {
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: (maxTitleChars - 5) + "ch",
        }
    }

    return (
        <Group mode="plain" separator="hide">
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "flex-start", alignItems: "center" }}>
                <Headline level="1" style={titleStyle}>{title}</Headline>
                <Headline>&ensp;–&ensp;</Headline>
                <Artist value={activeTrack?.artist || ""} />
            </div>
            <CurrentTimeSlider />
        </Group>
    )
};

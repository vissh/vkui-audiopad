import { Group, Headline } from "@vkontakte/vkui";
import { CSSProperties, FC } from "react";

import { useTypedSelector } from "../../../hooks/useTypedSelector";
import { Artist } from "../Artist";
import { CurrentTimeSlider } from "./CurrentTimeSlider";

export const CurrentTrack: FC = () => {
    const { activeTrack } = useTypedSelector(state => state.application);

    const maxTitleChars = 24;

    const titleStyle: CSSProperties = {
        display: "inline-block",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: maxTitleChars + "ch",
    };

    const title = (activeTrack?.title || "").trim();

    if (title.length < maxTitleChars) {
        titleStyle["minWidth"] = title.length + "ch";
    }

    return (
        <Group mode="plain" separator="hide">
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "flex-start", alignItems: "center" }}>
                <Headline level="1" style={titleStyle}>{title}</Headline>
                <Headline>&nbsp;–&nbsp;</Headline>
                <Artist value={activeTrack?.artist || ""} />
            </div>
            <CurrentTimeSlider />
        </Group>
    )
};

import {
    Icon24MoreHorizontal, Icon28SongOutline, Icon32PlayCircle
} from "@vkontakte/icons";
import { ButtonGroup, IconButton, Image, RichCell } from "@vkontakte/vkui";
import "@vkontakte/vkui/dist/vkui.css";
import { CSSProperties, FC } from "react";

import { ITrackItem } from "../../../types";

type Props = {
    track: ITrackItem;
    compact?: boolean;
};

export const Track: FC<Props> = ({ track, compact }) => {
    const truncateTextStyle: CSSProperties = (
        compact
            ? {
                display: "inline-block",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "28ch",
            }
            : {}
    );

    const richCellStyle: CSSProperties = (
        compact
            ? {
                minWidth: "362px",
                width: "362px",
            }
            : {}
    );

    return (
        <RichCell
            style={richCellStyle}
            before={
                <Image
                    src={track.image}
                >
                    <Image.Overlay theme="dark" visibility="on-hover">
                        <Icon32PlayCircle width={32} height={32} fill={"white"} />
                    </Image.Overlay>
                    {!track.image && (
                        <Icon28SongOutline />)}
                </Image>
            }
            after={
                <ButtonGroup gap="none">
                    <IconButton
                        hasHover={false}
                        hasActive={false}>
                    </IconButton>
                    <IconButton hasHover={false}><Icon24MoreHorizontal fill="var(--accent)" /></IconButton>
                </ButtonGroup>
            }
            caption={
                <span style={truncateTextStyle}>
                    {track.title}
                </span>
            }
        >
            <span style={truncateTextStyle}>
                {track.artist}
            </span>
        </RichCell>
    );
};

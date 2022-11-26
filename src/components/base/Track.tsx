import {
    Icon24MoreHorizontal, Icon28SongOutline, Icon32PlayCircle
} from "@vkontakte/icons";
import {
    Avatar, ButtonGroup, IconButton, RichCell
} from "@vkontakte/vkui";
import "@vkontakte/vkui/dist/vkui.css";
import { FC } from "react";

import { ITrackItem } from "../../types";

type TrackProps = {
    track: ITrackItem;
    cutText: boolean;
};

export const Track: FC<TrackProps> = ({ track, cutText }) => {
    return (
        <RichCell
            before={
                <Avatar
                    overlayIcon={<Icon32PlayCircle width={32} height={32} fill={"white"} />}
                    overlayMode="dark"
                    mode="image"
                    src={track.image}
                >
                    {track.image ? "" : <Icon28SongOutline />}
                </Avatar>
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
                <span style={{ display: "inline-block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "32ch" }}>
                    {track.title}
                </span>
            }
        >
            <span style={{ display: "inline-block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "32ch" }}>
                {track.artist}
            </span>
        </RichCell>
    );
};

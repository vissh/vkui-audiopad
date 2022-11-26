import {
    Icon24MoreHorizontal, Icon28SongOutline, Icon32PlayCircle
} from "@vkontakte/icons";
import {
    Avatar, ButtonGroup, IconButton, RichCell, Slider
} from "@vkontakte/vkui";
import "@vkontakte/vkui/dist/vkui.css";
import { FC, useState } from "react";

import { ITrackItem } from "../../types";

type TrackProps = {
    track: ITrackItem;
    cutText: boolean;
};

export const Track: FC<TrackProps> = ({ track, cutText }) => {
    const [position, setPosition] = useState(24.4234);

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
            // caption={
            //     <span style={{ display: "inline-block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "21ch" }}>
            //         {track.title}
            //     </span>
            // }
            text={
                <Slider
                    hidden={false}
                    value={Number(position)}
                    onChange={setPosition}
                />
            }
        >
            <span style={{ display: "inline-block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "21ch" }}>
                {track.artist}
            </span>
        </RichCell>
    );
};

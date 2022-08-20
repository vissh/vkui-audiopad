import React, { useState } from "react";
import { FC } from "react";
import {
    Avatar,
    ButtonGroup,
    Caption,
    IconButton,
    List,
    RichCell,
    Slider,
    Subhead,
    Text,
} from "@vkontakte/vkui";

import {
    Icon24MoreHorizontal,
    Icon32PlayCircle,
} from "@vkontakte/icons"

import "@vkontakte/vkui/dist/vkui.css";

import { ITrackItems } from '../types'
import { toHHMMSS } from '../utils'


export const Tracks: FC<ITrackItems> = ({ items }) => {
    const [position, setPosition] = useState(24.4234);

    return (
        <List>
            {items.map(track =>
                <RichCell
                    before={
                        <Avatar
                            overlayIcon={<Icon32PlayCircle width={32} height={32} fill={'white'} />}
                            overlayMode="dark"
                            mode="image"
                            src={track.image}
                        />
                    }
                    after={
                        <ButtonGroup gap="none">
                            <IconButton
                                hasHover={false}
                                hasActive={false}>
                                <Caption
                                    weight={"3"}
                                    style={{ color: "var(--vkui--color_text_secondary)" }}
                                >
                                    {toHHMMSS(track.duration)}
                                </Caption>
                            </IconButton>
                            <IconButton hasHover={false}><Icon24MoreHorizontal fill="var(--accent)" /></IconButton>
                        </ButtonGroup>
                    }
                    caption={track.title}
                    bottom={
                        <Slider
                            hidden={false}
                            value={Number(position)}
                            onChange={setPosition}
                        />
                    }
                >
                    {track.artist}
                </RichCell>
            )}
        </List>
    );
};

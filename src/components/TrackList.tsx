import { useState } from "react";
import { FC } from "react";
import {
    Avatar,
    List,
    RichCell,
    Slider,
} from "@vkontakte/vkui";

import {
    Icon24MoreHorizontal,
    Icon32PlayCircle,
} from "@vkontakte/icons"

import "@vkontakte/vkui/dist/vkui.css";

import { ITrackItems } from '../types'


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
                            src={track.image} />}
                    after={<Icon24MoreHorizontal fill="var(--accent)" />}
                    caption={track.title}
                    afterCaption={toHHMMSS(track.duration)}
                    bottom={
                        <Slider
                            hidden={false}
                            value={Number(position)}
                            onChange={setPosition} />}
                >
                    {track.artist}
                </RichCell>
            )}
        </List>
    );
};


function toHHMMSS(seconds: number): string {
    let s = new Date(seconds * 1000).toISOString()
    let result = seconds < 3600 ? s.substring(14, 19) : s.substring(11, 16)
    return result.startsWith('0') ? result.slice(1, result.length) : result
}

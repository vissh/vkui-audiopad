import React, { useState } from "react";
import { FC } from "react";
import {
    Avatar,
    Button,
    ButtonGroup,
    Caption,
    Group,
    IconButton,
    List,
    Panel,
    PanelSpinner,
    Placeholder,
    RichCell,
    Separator,
    Slider,
} from "@vkontakte/vkui";

import {
    Icon24MoreHorizontal,
    Icon32PlayCircle,
    Icon56MentionOutline,
    Icon56UsersOutline,
    Icon56SearchOutline,
} from "@vkontakte/icons"

import "@vkontakte/vkui/dist/vkui.css";

import { toHHMMSS } from '../utils'
import { useTypedSelector } from "../hooks/useTypedSelector";
import { ITrackItem } from "../types";


export const Tracks: FC = () => {
    const { loading, tracks } = useTypedSelector(state => state.playlist);

    return (
        <List>
            {loading
                ? <Loading />
                : tracks.length
                    ? tracks.map(track => <Track track={track} />)
                    : <EmptyResult />
            }
        </List>
    );
};

type TrackProps = {
    track: ITrackItem;
};

const Track: FC<TrackProps> = ({ track }) => {
    const [position, setPosition] = useState(24.4234);

    return (
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
    );
};

const Loading: FC = () => {
    return (
        <Panel>
            <PanelSpinner />
            <br /><br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br /><br />
        </Panel>
    );
};


const EmptyResult: FC = () => {
    return (
        <Placeholder icon={<Icon56SearchOutline />}>
            No tracks found
            <br /><br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br /><br />
        </Placeholder>
    );
};
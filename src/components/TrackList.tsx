import { useState } from "react";
import { FC } from "react";
import {
    Avatar,
    ButtonGroup,
    Group,
    Header,
    HorizontalScroll,
    IconButton,
    Link,
    List,
    Panel,
    PanelSpinner,
    Placeholder,
    RichCell,
    Slider,
} from "@vkontakte/vkui";

import {
    Icon24MoreHorizontal,
    Icon32PlayCircle,
    Icon56MusicOutline,
    Icon28SongOutline,
} from "@vkontakte/icons"

import "@vkontakte/vkui/dist/vkui.css";

import { useTypedSelector } from "../hooks/useTypedSelector";
import { ITrackItem } from "../types";
import React from "react";
import { chunked } from "../utils";


export const Tracks: FC = () => {
    const { loading, tracks } = useTypedSelector(state => state.playlist);

    return (
        <React.Fragment>
            {loading ? <Loading /> : tracks.length ? <HorizantalTracks tracks={tracks} /> : <EmptyResult />}
        </React.Fragment>
    );
};


type HorizontalTracksProps = {
    tracks: ITrackItem[];
};

const HorizantalTracks: FC<HorizontalTracksProps> = ({ tracks }) => {
    return (
        <Group
            mode="plain"
            header={<Header mode="secondary" aside={<Link>Показать все</Link>}>Недавно прослушанные</Header>}>

            <HorizontalScroll>
                <div style={{ display: "flex" }}>
                    {Array.from(chunked(tracks, 3, 6)).map(groupedTracks => (
                        <List>
                            {groupedTracks.map(track => <Track track={track} />)}
                        </List>
                    ))}
                </div>
            </HorizontalScroll>

        </Group>
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
            caption={track.title}
            bottom={
                <Slider
                    hidden={true}
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
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
        </Panel>
    );
};


const EmptyResult: FC = () => {
    return (
        <Placeholder icon={<Icon56MusicOutline />}>
            По запросу не найдено ни одной аудиозаписи
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
            <br /><br /><br /><br /><br />
        </Placeholder>
    );
};
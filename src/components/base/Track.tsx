import '@vkontakte/vkui/dist/vkui.css';

import {
    Icon24MoreHorizontal, Icon28SongOutline, Icon32PlayCircle
} from '@vkontakte/icons';
import {
    Avatar, ButtonGroup, IconButton, RichCell, Slider
} from '@vkontakte/vkui';
import { FC, useState } from 'react';

import { ITrackItem } from '../../types';

type TrackProps = {
    track: ITrackItem;
};

export const Track: FC<TrackProps> = ({ track }) => {
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
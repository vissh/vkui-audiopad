import { Icon28SongOutline } from "@vkontakte/icons";
import { IconButton, Image } from "@vkontakte/vkui";
import { FC } from "react";

import { useTypedSelector } from "../../../hooks/useTypedSelector";

export const TrackIcon: FC = () => {
    const { activeTrack } = useTypedSelector(state => state.application);

    return (
        <IconButton hasHover={false} hasActive={false} style={{ height: 48 }}>
            {activeTrack && activeTrack.image
                ? <Image src={activeTrack.image} />
                : <Image><Icon28SongOutline /></Image>}
        </IconButton>
    );
};

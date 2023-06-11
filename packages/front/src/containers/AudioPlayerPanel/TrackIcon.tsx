import { Icon28SongOutline } from "@vkontakte/icons";
import { IconButton, Image } from "@vkontakte/vkui";
import { FC } from "react";
import { useAtomValue } from "../../core/atom";
import { activeTrackAtom } from "../../core/atoms";

export const TrackIcon: FC = () => {
    const activeTrack = useAtomValue(activeTrackAtom);

    return (
        <IconButton hasHover={false} hasActive={false} style={{ height: 48 }}>
            {activeTrack && activeTrack.image
                ? <Image src={activeTrack.image} />
                : <Image><Icon28SongOutline /></Image>}
        </IconButton>
    );
};

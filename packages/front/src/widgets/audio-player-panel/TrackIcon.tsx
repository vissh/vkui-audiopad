import { Icon28SongOutline } from "@vkontakte/icons";
import { IconButton, Image } from "@vkontakte/vkui";
import { useAtomValue } from "shared/lib/atom";
import { FC } from "react";
import { activeTrackAtom } from "shared/appAtoms";

export const TrackIcon: FC = () => {
    const activeTrack = useAtomValue(activeTrackAtom);

    return (
        <IconButton
            hasHover={false}
            hasActive={false}
            style={{ height: 48 }}
        >
            {activeTrack && activeTrack.image ? (
                <Image src={activeTrack.image} />
            ) : (
                <Image>
                    <Icon28SongOutline />
                </Image>
            )}
        </IconButton>
    );
};

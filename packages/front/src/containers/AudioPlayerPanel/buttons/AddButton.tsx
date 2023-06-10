import { baseEnums, baseTypes } from "@vk-audiopad/common";
import { Icon24AddOutline, Icon24DoneOutline } from "@vkontakte/icons";
import { WriteBarIcon } from "@vkontakte/vkui";
import { FC } from "react";
import { atom, useAtom, useAtomValue } from "../../../core/atom";
import { activeTrackAtom, userIdAtom } from "../../../core/atoms/storage";
import { fetchAddTrack } from "../../../core/fetchers/addTrack";
import { fetchRemoveTrack } from "../../../core/fetchers/removeTrack";

const latestAddedTracksAtom = atom({} as Record<string, baseTypes.TTrackItem>);

export const AddButton: FC = () => {
    const userId = useAtomValue(userIdAtom);
    const activeTrack = useAtomValue(activeTrackAtom);
    const [latestAddedTracks, setLatestAddedTracks] = useAtom(latestAddedTracksAtom);

    const trackHasAdded = !!(activeTrack && latestAddedTracks[activeTrack.id]);
    const canAdd = !!(activeTrack && activeTrack.flags & baseEnums.EAudioFlagBit.CAN_ADD);
    const showButton: boolean = canAdd && userId !== activeTrack.id.split("_")[0];

    const onClick = async () => {
        if (activeTrack) {
            if (trackHasAdded) {
                const addedTrack = latestAddedTracks[activeTrack.id];
                await fetchRemoveTrack(addedTrack);
                delete latestAddedTracks[activeTrack.id]
                setLatestAddedTracks({ ...latestAddedTracks });
            } else {
                const addedTrack = await fetchAddTrack(activeTrack);
                latestAddedTracks[activeTrack.id] = addedTrack;
                setLatestAddedTracks({ ...latestAddedTracks });
            }
        }
    };

    return (
        <>
            {showButton &&
                <WriteBarIcon
                    onClick={onClick}
                >
                    {trackHasAdded ? <Icon24DoneOutline /> : <Icon24AddOutline />}
                </WriteBarIcon>
            }
        </>
    );
};

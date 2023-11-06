import { baseEnums, baseTypes } from "@vk-audiopad/common";
import { AddToMyMusicButton } from "features/add-to-my-music";
import { DeleteFromMyMusicButton } from "features/delete-from-my-music";
import { SettingButton } from "features/open-settings";
import { RepeatButton } from "features/repeat";
import { ShuffleButton } from "features/shuffle";
import { SimilarButton } from "features/similar/ui/SimilarButton";
import { FC } from "react";
import { atom, useAtom, useAtomValue } from "shared/lib/atom";
import { activeTrackAtom, userIdAtom } from "shared/model/storage-atoms";

const latestAddedTracksAtom = atom({} as Record<string, baseTypes.TTrackItem>);

export const Buttons: FC = () => {
    const userId = useAtomValue(userIdAtom);
    const activeTrack = useAtomValue(activeTrackAtom);
    const [latestAddedTracks, setLatestAddedTracks] = useAtom(latestAddedTracksAtom);

    const trackHasAdded = !!(activeTrack && latestAddedTracks[activeTrack.id]);
    const canAdd = !!(activeTrack && activeTrack.flags & baseEnums.EAudioFlagBit.CAN_ADD);
    const showButton: boolean = canAdd && userId !== activeTrack.id.split("_")[0];

    return (
        <>
            {showButton && activeTrack && (
                <>
                    {trackHasAdded ? (
                        <DeleteFromMyMusicButton
                            track={latestAddedTracks[activeTrack.id]}
                            onAfterDelete={() => {
                                delete latestAddedTracks[activeTrack.id];
                                setLatestAddedTracks({ ...latestAddedTracks });
                            }}
                        />
                    ) : (
                        <AddToMyMusicButton
                            track={activeTrack}
                            onAfterAdd={(addedTrack) => {
                                latestAddedTracks[activeTrack.id] = addedTrack;
                                setLatestAddedTracks({ ...latestAddedTracks });
                            }}
                        />
                    )}
                </>
            )}
            <ShuffleButton />
            <RepeatButton />
            {activeTrack && (
                <SimilarButton
                    padding
                    userId={userId}
                    track={activeTrack}
                />
            )}
            <SettingButton />
        </>
    );
};

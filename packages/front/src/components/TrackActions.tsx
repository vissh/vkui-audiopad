import { baseEnums, baseTypes } from "@vk-audiopad/common";
import { Icon20Add, Icon20Cancel, Icon20ListPlayOutline, Icon28AddOutline, Icon28CancelOutline, Icon28ListPlayOutline } from "@vkontakte/icons";
import { ActionSheet, ActionSheetDefaultIosCloseItem, ActionSheetItem, AdaptiveIconRenderer, Alert } from "@vkontakte/vkui";
import { ToggleRef } from "@vkontakte/vkui/dist/components/ActionSheet/types";
import { FC } from "react";
import { actions } from "../core/actions";
import { useAtomValue, useSetAtom } from "../core/atom";
import { activeTrackAtom, mutationAtom, popoutAtom, userIdAtom } from "../core/atoms";
import { fetchAddTrack } from "../core/fetchers/addTrack";
import { fetchRemoveTrack } from "../core/fetchers/removeTrack";
import "./Artist.css";

type Props = {
    track: baseTypes.TTrackItem;
    updateTrack: (newTrack: baseTypes.TTrackItem) => void,
    deleteTrack: (newTrack: baseTypes.TTrackItem) => void,
    toggleRef: ToggleRef;
};

export const TrackActions: FC<Props> = ({ track, updateTrack, deleteTrack, toggleRef }) => {
    const userId = useAtomValue(userIdAtom);
    const activeTrack = useAtomValue(activeTrackAtom);
    const setPopout = useSetAtom(popoutAtom);
    const setMutation = useSetAtom(mutationAtom);

    const trackUserId = track.id.split("_")[0];
    const canAdd = !!(track && track.flags & baseEnums.EAudioFlagBit.CAN_ADD);
    const showAddButton: boolean = canAdd && userId !== trackUserId;
    const showRemoveButton: boolean = userId === trackUserId;

    return (
        <ActionSheet
            onClose={() => setPopout(null)}
            iosCloseItem={<ActionSheetDefaultIosCloseItem />}
            toggleRef={toggleRef}
        >
            {activeTrack &&
                <ActionSheetItem
                    before={
                        <AdaptiveIconRenderer
                            IconCompact={Icon20ListPlayOutline}
                            IconRegular={Icon28ListPlayOutline}
                        />
                    }
                    onClick={() => actions.addToQueue(track)}
                    autoClose
                >
                    Воспроизвести следующей
                </ActionSheetItem>
            }

            {showAddButton &&
                <ActionSheetItem
                    before={
                        <AdaptiveIconRenderer
                            IconCompact={Icon20Add}
                            IconRegular={Icon28AddOutline}
                        />
                    }
                    onClick={async () => {
                        const newTrack = await fetchAddTrack(track);
                        actions.addTrack(newTrack);
                        updateTrack(newTrack);
                        setMutation(Date.now());
                    }}
                    autoClose
                >
                    Добавить в мою музыку
                </ActionSheetItem>
            }

            {showRemoveButton &&
                <ActionSheetItem
                    mode="destructive"
                    before={
                        <AdaptiveIconRenderer
                            IconCompact={Icon20Cancel}
                            IconRegular={Icon28CancelOutline}
                        />
                    }
                    onClick={() => openDeletion(track, deleteTrack)}
                    autoClose
                >
                    Удалить из «Моей музыки»
                </ActionSheetItem>
            }

            <ActionSheetItem
                onClick={() => setPopout(null)}
                autoClose
                mode="cancel"
            >
                Закрыть
            </ActionSheetItem>

        </ActionSheet>
    );
};

const openDeletion = (track: baseTypes.TTrackItem, deleteTrack: ((newTrack: baseTypes.TTrackItem) => void)) => {
    const setPopout = useSetAtom(popoutAtom);
    const setMutation = useSetAtom(mutationAtom);

    setPopout(
        <Alert
            actions={[
                {
                    title: 'Отмена',
                    autoClose: true,
                    mode: 'cancel',
                },
                {
                    title: 'Удалить',
                    autoClose: true,
                    mode: 'destructive',
                    action: async () => {
                        await fetchRemoveTrack(track);
                        actions.removeTrack(track);
                        deleteTrack({ ...track, flags: track.flags | baseEnums.EAudioFlagBit.CLAIMED });
                        setMutation(Date.now());
                    },
                },
            ]}
            actionsLayout="horizontal"
            onClose={() => setPopout(null)}
            header="Удаление трека из «Моей музыки»"
            text="Вы уверены, что хотите удалить трек?"
        />,
    );

    document.body.style.position = "unset" // TODO: Genius!

};

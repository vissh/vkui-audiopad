import { baseEnums, baseTypes } from "@vk-audiopad/common";
import {
    Icon20Add,
    Icon20Cancel,
    Icon20ListPlayOutline,
    Icon20MusicMicOutline,
    Icon28AddOutline,
    Icon28CancelOutline,
    Icon28ListPlayOutline,
    Icon28MusicMicOutline,
} from "@vkontakte/icons";
import {
    ActionSheet,
    ActionSheetDefaultIosCloseItem,
    ActionSheetItem,
    AdaptiveIconRenderer,
    Alert,
} from "@vkontakte/vkui";
import { ToggleRef } from "@vkontakte/vkui/dist/components/ActionSheet/types";
import { FC } from "react";
import { fetchAddTrack, fetchRemoveTrack } from "shared/api";
import {
    activeModalPageAtom,
    activeTrackAtom,
    popoutAtom,
    selectedTabAtom,
    trackArtistsAtom,
    userIdAtom,
} from "shared/appAtoms";
import { actions } from "shared/lib/actions";
import {
    sendEventAddToQueue,
    sendEventAddTrack,
    sendEventClickArtist,
    sendEventRemoveCancelTrack,
    sendEventRemoveTrack,
} from "shared/lib/analytics";
import { useAtom, useAtomValue, useSetAtom } from "shared/lib/atom";
import { EModalPage } from "shared/types";

type TrackActionsProps = {
    track: baseTypes.TTrackItem;
    updateTrack: (newTrack: baseTypes.TTrackItem) => void;
    deleteTrack: (newTrack: baseTypes.TTrackItem) => void;
    toggleRef: ToggleRef;
};

export const TrackActions: FC<TrackActionsProps> = ({ track, updateTrack, deleteTrack, toggleRef }) => {
    const userId = useAtomValue(userIdAtom);
    const activeTrack = useAtomValue(activeTrackAtom);
    const [selectedTab, setSelectedTab] = useAtom(selectedTabAtom);
    const setPopout = useSetAtom(popoutAtom);
    const setTrackArtists = useSetAtom(trackArtistsAtom);
    const setActiveModal = useSetAtom(activeModalPageAtom);

    const trackUserId = track.id.split("_")[0];
    const canAdd = !!(track && track.flags & baseEnums.EAudioFlagBit.CAN_ADD);
    const showAddButton: boolean = canAdd && userId !== trackUserId;
    const showRemoveButton: boolean = userId === trackUserId;
    const artists = [...track.mainArtists, ...track.featArtists];

    return (
        <ActionSheet
            onClose={() => setPopout(null)}
            iosCloseItem={<ActionSheetDefaultIosCloseItem />}
            toggleRef={toggleRef}
        >
            {activeTrack && (
                <ActionSheetItem
                    before={
                        <AdaptiveIconRenderer
                            IconCompact={Icon20ListPlayOutline}
                            IconRegular={Icon28ListPlayOutline}
                        />
                    }
                    onClick={() => {
                        actions.addToQueue(track);
                        sendEventAddToQueue(selectedTab.tab);
                    }}
                    autoClose
                >
                    Воспроизвести следующей
                </ActionSheetItem>
            )}

            {showAddButton && (
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
                        sendEventAddTrack(selectedTab.tab);
                    }}
                    autoClose
                >
                    Добавить в мою музыку
                </ActionSheetItem>
            )}

            {showRemoveButton && (
                <ActionSheetItem
                    mode="destructive"
                    before={
                        <AdaptiveIconRenderer
                            IconCompact={Icon20Cancel}
                            IconRegular={Icon28CancelOutline}
                        />
                    }
                    onClick={() => openDeletion(selectedTab.tab, track, deleteTrack)}
                    autoClose
                >
                    Удалить из «Моей музыки»
                </ActionSheetItem>
            )}

            {artists.length > 0 && (
                <ActionSheetItem
                    before={
                        <AdaptiveIconRenderer
                            IconCompact={Icon20MusicMicOutline}
                            IconRegular={Icon28MusicMicOutline}
                        />
                    }
                    onClick={() => {
                        if (artists.length === 1) {
                            const artist = artists[0];
                            setSelectedTab({
                                tab: baseEnums.EContentTab.ARTIST,
                                id: artist.id,
                                name: artist.name,
                            });
                        } else {
                            setTrackArtists(artists);
                            setActiveModal(EModalPage.ARTISTS);
                        }
                        sendEventClickArtist(selectedTab.tab);
                    }}
                    autoClose
                >
                    Перейти к артисту
                </ActionSheetItem>
            )}

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

const openDeletion = (
    tabName: baseEnums.EContentTab,
    track: baseTypes.TTrackItem,
    deleteTrack: (newTrack: baseTypes.TTrackItem) => void,
) => {
    const setPopout = useSetAtom(popoutAtom);

    setPopout(
        <Alert
            actions={[
                {
                    title: "Отмена",
                    autoClose: true,
                    mode: "cancel",
                    action: () => {
                        sendEventRemoveCancelTrack(tabName);
                    },
                },
                {
                    title: "Удалить",
                    autoClose: true,
                    mode: "destructive",
                    action: async () => {
                        await fetchRemoveTrack(track);
                        actions.removeTrack(track);
                        deleteTrack({ ...track, flags: track.flags | baseEnums.EAudioFlagBit.CLAIMED });
                        sendEventRemoveTrack(tabName);
                    },
                },
            ]}
            actionsLayout="horizontal"
            onClose={() => setPopout(null)}
            header="Удаление трека из «Моей музыки»"
            text="Вы уверены, что хотите удалить трек?"
        />,
    );

    document.body.style.position = "unset"; // TODO: Genius!
};

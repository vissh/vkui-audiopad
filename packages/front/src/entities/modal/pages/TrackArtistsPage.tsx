import { baseEnums } from "@vk-audiopad/common";
import {
    Group,
    ModalPage,
    ModalPageHeader,
    PanelHeaderClose,
    Platform,
    SimpleCell,
    useAdaptivityConditionalRender,
    usePlatform,
} from "@vkontakte/vkui";
import { useAtom, useAtomValue, useSetAtom } from "shared/lib/atom";
import { activeModalPageAtom, selectedTabAtom, trackArtistsAtom } from "shared/appAtoms";
import { sendEventSearchTrack } from "shared/lib/analytics";

export const TrackArtistsPage = ({ ...props }) => {
    const [selectedTab, setSelectedTab] = useAtom(selectedTabAtom);
    const setActiveModal = useSetAtom(activeModalPageAtom);
    const trackArtists = useAtomValue(trackArtistsAtom);
    const platform = usePlatform();
    const { sizeX } = useAdaptivityConditionalRender();

    return (
        <ModalPage
            {...props}
            header={
                <ModalPageHeader
                    before={
                        sizeX.compact &&
                        platform === Platform.ANDROID && <PanelHeaderClose className={sizeX.compact.className} />
                    }
                >
                    Перейти к артисту
                </ModalPageHeader>
            }
        >
            <Group>
                {trackArtists.map((artist) => (
                    <SimpleCell
                        onClick={() => {
                            setActiveModal(null);
                            setSelectedTab({
                                tab: baseEnums.EContentTab.ARTIST,
                                id: artist.id,
                                name: artist.name,
                            });
                            sendEventSearchTrack(selectedTab.tab);
                        }}
                    >
                        {artist.name}
                    </SimpleCell>
                ))}
            </Group>
        </ModalPage>
    );
};

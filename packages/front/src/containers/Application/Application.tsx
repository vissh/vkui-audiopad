import { AppRoot, Panel, SplitCol, SplitLayout, View } from "@vkontakte/vkui";
import { FC, useEffect } from "react";
import { useAtomValue } from "../../core/atom";
import { popoutAtom, selectedTabAtom, webTokenAtom } from "../../core/atoms";
import { AudioPlayerPanel } from "../AudioPlayerPanel/AudioPlayerPanel";
import { ContentPanel } from "../ContentPanel/ContentPanel";
import { Modal } from "../Modal/Modal";
import { SignInPanel } from "../SignInPanel";
import { useUpdateWebToken } from "./hooks";

export const Application: FC = () => {
    const webToken = useAtomValue(webTokenAtom);
    const selectedTab = useAtomValue(selectedTabAtom);
    const popout = useAtomValue(popoutAtom);

    const { isLoading } = useUpdateWebToken();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [selectedTab]);

    const wait: boolean = !webToken || (webToken.error?.type === "unauthorized" && isLoading);
    const signedIn: boolean = !!webToken && !webToken.error;

    return (
        <AppRoot>
            <SplitLayout modal={<Modal />} popout={popout}>
                <SplitCol>
                    <View activePanel="vkaudiopad">
                        <Panel id="vkaudiopad">
                            {!wait &&
                                (signedIn
                                    ? <>
                                        <AudioPlayerPanel />
                                        <ContentPanel />
                                    </>
                                    : <SignInPanel />
                                )}
                        </Panel>
                    </View>
                </SplitCol>
            </SplitLayout>
        </AppRoot>
    );
};

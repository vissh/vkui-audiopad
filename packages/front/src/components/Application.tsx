import { storage, types } from "@vk-audiopad/common";
import { AppRoot, Panel, SplitCol, SplitLayout, View } from "@vkontakte/vkui";
import React, { FC, useEffect } from "react";

import { useApllicationActions } from "../hooks/useActions";
import { useTypedSelector } from "../hooks/useTypedSelector";
import { fetchAppWebToken, loadApplicationState, setSelectedTab } from "../store/slice";
import { useAppDispatch } from "../store/store";
import { AudioControls } from "./AudioControls/AudioControls";
import { ContentPanel } from "./ContentPanel";
import { SignInPanel } from "./panels/SignInPanel";

export const Application: FC = () => {
    const { currentPlaylistExists, selectedTab, webToken, userId, webTokenLoading, webTokenLoaded } = useTypedSelector(state => state.application);
    const { applyChanges } = useApllicationActions();
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(loadApplicationState());
        storage.listen(applyChanges);
    }, []);

    useEffect(() => {
        if (userId && selectedTab.tab === types.ContentTab.UNKNOWN && currentPlaylistExists !== null) {
            dispatch(setSelectedTab({ tab: currentPlaylistExists ? types.ContentTab.CURRENT_PLAYLIST : types.ContentTab.MY_MUSIC }));
        }

    }, [userId, currentPlaylistExists, selectedTab]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [selectedTab]);

    useEffect(() => {
        !webTokenLoading && !webTokenLoaded && dispatch(fetchAppWebToken());
    }, [webTokenLoading, webTokenLoaded]);

    return (
        <AppRoot>
            <SplitLayout>
                <SplitCol>
                    <View activePanel="vkaudiopad">
                        <Panel id="vkaudiopad">
                            {webToken && !webToken.error && (
                                <React.Fragment>
                                    <AudioControls />
                                    <ContentPanel />
                                    {/* <VKComboBanner /> */}
                                </React.Fragment>
                            )}

                            {webTokenLoaded && webToken && webToken.error?.type === "unauthorized" && (
                                <SignInPanel />
                            )}

                        </Panel>
                    </View>
                </SplitCol>
            </SplitLayout>
        </AppRoot>

    );
};

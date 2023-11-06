import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { baseEnums } from "@vk-audiopad/common";
import {
    AdaptivityProvider,
    AppRoot,
    ConfigProvider,
    Panel,
    Platform,
    SplitCol,
    SplitLayout,
    View,
} from "@vkontakte/vkui";
import "@vkontakte/vkui/dist/vkui.css";
import { AppModalRoot, themeAtom } from "entities/modal";
import { AppSnackbar } from "entities/snackbar";
import { SignIn } from "features/sign-in";
import { FC } from "react";
import { useAtomValue } from "shared/lib/atom";
import { AudioPlayerPanel } from "widgets/audio-player-panel";
import { Router } from "./Router";
import "./base.css";

declare global {
    interface Window {
        _tmr: undefined | Array<any>;
    }
}

export const queryClient = new QueryClient();

export const Application: FC = () => {
    const theme = useAtomValue(themeAtom);

    return (
        <ConfigProvider
            platform={Platform.ANDROID}
            hasCustomPanelHeaderAfter={false}
            appearance={theme === baseEnums.ETheme.SYSTEM ? undefined : theme}
        >
            <AdaptivityProvider>
                <QueryClientProvider client={queryClient}>
                    <AppRoot>
                        <SplitLayout
                            style={{ justifyContent: "center" }}
                            modal={<AppModalRoot />}
                        >
                            <SplitCol
                                maxWidth={1280}
                                minWidth={780}
                            >
                                <View activePanel="vkaudiopad">
                                    <Panel id="vkaudiopad">
                                        <SignIn>
                                            <AudioPlayerPanel />
                                            <Router />
                                        </SignIn>
                                        <AppSnackbar />
                                    </Panel>
                                </View>
                            </SplitCol>
                        </SplitLayout>
                    </AppRoot>
                </QueryClientProvider>
            </AdaptivityProvider>
        </ConfigProvider>
    );
};

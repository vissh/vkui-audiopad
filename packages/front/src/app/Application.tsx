import { AppRoot, Panel, SplitCol, SplitLayout, View } from "@vkontakte/vkui";
import { AppModalRoot } from "entities/modal";
import { FC } from "react";
import { popoutAtom } from "shared/appAtoms";
import { useAtomValue } from "shared/lib/atom";
import { SignInPanel } from "widgets/SignInPanel";
import { AudioPlayerPanel } from "widgets/audio-player-panel";
import { ContentPanel } from "../pages/ContentPanel";
import { useUpdateWebToken } from "./hooks";

export const Application: FC = () => {
    const popout = useAtomValue(popoutAtom);

    const { data: webToken } = useUpdateWebToken();

    const signedIn: boolean = !webToken || !webToken.error;

    return (
        <AppRoot>
            <SplitLayout
                style={{ justifyContent: "center" }}
                modal={<AppModalRoot />}
                popout={popout}
            >
                <SplitCol
                    maxWidth={1280}
                    minWidth={780}
                >
                    <View activePanel="vkaudiopad">
                        <Panel id="vkaudiopad">
                            {signedIn ? (
                                <>
                                    <AudioPlayerPanel />
                                    <ContentPanel />
                                </>
                            ) : (
                                <SignInPanel />
                            )}
                        </Panel>
                    </View>
                </SplitCol>
            </SplitLayout>
        </AppRoot>
    );
};

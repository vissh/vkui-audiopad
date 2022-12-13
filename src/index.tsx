import "@vkontakte/vkui/dist/vkui.css";

import {
    AdaptivityProvider, AppRoot, ConfigProvider, Panel, Platform, SplitCol,
    SplitLayout, View, WebviewType
} from "@vkontakte/vkui";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import { AudioControls } from "./front/components/AudioControls";
import { ContentPanel } from "./front/components/ContentPanel";
import { store } from "./front/store/store";

const App = () => {
    return (
        <ConfigProvider
            platform={Platform.ANDROID}
            webviewType={WebviewType.INTERNAL}
        >
            <AdaptivityProvider>
                <Provider store={store}>
                    <AppRoot>
                        <SplitLayout>
                            <SplitCol>
                                <View activePanel="vkaudiopad">
                                    <Panel id="vkaudiopad">
                                        {/* <Ads /> */}
                                        <AudioControls />
                                        <ContentPanel />
                                    </Panel>
                                </View>
                            </SplitCol>
                        </SplitLayout>
                    </AppRoot>
                </Provider>
            </AdaptivityProvider>
        </ConfigProvider>
    );
};

ReactDOM.render(
    <App />,
    document.getElementById("root")
);

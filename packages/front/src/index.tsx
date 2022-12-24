import "@vkontakte/vkui/dist/vkui.css";

import {
    AdaptivityProvider, AppRoot, ConfigProvider, Panel, Platform, SplitCol,
    SplitLayout, View, WebviewType
} from "@vkontakte/vkui";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import { AudioControls } from "./components/AudioControls";
import { ContentPanel } from "./components/ContentPanel";
import { store } from "./store/store";

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
                                        {/* <VKComboBanner /> */}
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

import "@vkontakte/vkui/dist/vkui.css";

import {
    AdaptivityProvider, ConfigProvider, Platform, WebviewType
} from "@vkontakte/vkui";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import { Application } from "./components/Application";
import { store } from "./store/store";

const App = () => {
    return (
        <ConfigProvider
            platform={Platform.ANDROID}
            webviewType={WebviewType.INTERNAL}
        >
            <AdaptivityProvider>
                <Provider store={store}>
                    <Application />
                </Provider>
            </AdaptivityProvider>
        </ConfigProvider>
    );
};

ReactDOM.render(
    <App />,
    document.getElementById("root")
);

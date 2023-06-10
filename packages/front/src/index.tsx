import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { baseEnums } from "@vk-audiopad/common";
import { AdaptivityProvider, ConfigProvider, Platform, WebviewType } from "@vkontakte/vkui";
import "@vkontakte/vkui/dist/vkui.css";
import ReactDOM from "react-dom";
import { Application } from "./containers/Application/Application";
import { useAtomValue } from "./core/atom";
import { themeAtom } from "./core/atoms/storage";

export const queryClient = new QueryClient();

const App = () => {
    const theme = useAtomValue(themeAtom);

    return (
        <ConfigProvider
            platform={Platform.ANDROID}
            webviewType={WebviewType.INTERNAL}
            appearance={theme === baseEnums.ETheme.SYSTEM ? undefined : theme}
        >
            <AdaptivityProvider>
                <QueryClientProvider client={queryClient}>
                    <Application />
                </QueryClientProvider>
            </AdaptivityProvider>
        </ConfigProvider>
    );
};

ReactDOM.render(
    <App />,
    document.getElementById("root")
);

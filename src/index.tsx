import ReactDOM from "react-dom";
import {
  AppRoot,
  SplitLayout,
  SplitCol,
  ConfigProvider,
  AdaptivityProvider,
  Platform,
  WebviewType,
  Panel,
  Group,
  View,
} from "@vkontakte/vkui";


import "@vkontakte/vkui/dist/vkui.css";

import { Tracks } from './components/TrackList'
import { SearchTracks } from './components/SearchTracks'
import { Provider } from "react-redux";
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
                <View activePanel="mytracks">
                  <Panel id="mytracks">
                    <Group>
                      <SearchTracks />
                      <Tracks />
                    </Group>
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

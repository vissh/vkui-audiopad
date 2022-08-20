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
import { ITrackItems } from "./types";
import { useState } from "react";
import { Provider } from "react-redux";
import { store } from "./store/store";


const App = () => {
  const [tracks, setTracks] = useState<ITrackItems>({ items: [] } as ITrackItems);

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
                      <SearchTracks setTracks={setTracks} />
                      <Tracks items={tracks.items} />
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

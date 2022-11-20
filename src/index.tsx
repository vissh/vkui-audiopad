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
  Tabs,
  TabsItem,
  PanelHeader,
} from "@vkontakte/vkui";

import "@vkontakte/vkui/dist/vkui.css";

import { Tracks } from './components/TrackList'
import { SearchTracks } from './components/SearchTracks'
import { Provider } from "react-redux";
import { store } from "./store/store";
import { useState } from "react";


const App = () => {
  const [selected, setSelected] = useState("my-music");

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
                    <PanelHeader>
                      <Tabs>
                        <TabsItem
                          selected={selected === "my-music"}
                          id="tab-my-music"
                          aria-controls="tab-content-my-music"
                          onClick={() => {
                            setSelected("my-music");
                          }}
                        >
                          Моя музыка
                        </TabsItem>
                      </Tabs>
                    </PanelHeader>

                    <Group
                      id="tab-content-my-music"
                      aria-labelledby="tab-my-music"
                      role="tabpanel"
                      hidden={selected !== "my-music"}
                    >
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

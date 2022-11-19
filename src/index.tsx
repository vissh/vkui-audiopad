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
  const [selected, setSelected] = useState("current-playlist");

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
                          selected={selected === "current-playlist"}
                          id="tab-current-playlist"
                          aria-controls="tab-content-current-playlist"
                          onClick={() => {
                            setSelected("current-playlist");
                          }}
                        >
                          Текущий плейлист
                        </TabsItem>
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
                        <TabsItem
                          selected={selected === "recently-played"}
                          id="tab-recently-played"
                          aria-controls="tab-content-recently-played"
                          onClick={() => {
                            setSelected("recently-played");
                          }}
                        >
                          Недавно прослушанные
                        </TabsItem>
                      </Tabs>
                    </PanelHeader>

                    <Group
                      id="tab-content-current-playlist"
                      aria-labelledby="tab-current-playlist"
                      role="tabpanel"
                      hidden={selected !== "current-playlist"}
                    >
                      <SearchTracks />
                      <Tracks />
                    </Group>

                    {selected === "my-music" && (
                      <Group
                        id="tab-content-my-music"
                        aria-labelledby="tab-my-music"
                        role="tabpanel"
                      >
                      </Group>
                    )}

                    {selected === "recently-played" && (
                      <Group
                        id="tab-content-recently-played"
                        aria-labelledby="tab-recently-played"
                        role="tabpanel"
                      >
                      </Group>
                    )}

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

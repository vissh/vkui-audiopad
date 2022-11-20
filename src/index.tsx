import '@vkontakte/vkui/dist/vkui.css';

import {
  AdaptivityProvider, AppRoot, ConfigProvider, Group, Panel, PanelHeader, Platform, SplitCol,
  SplitLayout, Tabs, TabsItem, View, WebviewType
} from '@vkontakte/vkui';
import { useState } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import { MyMusicPanel } from './components/MyMusicPanel';
import { SearchPanel } from './components/SearchPanel';
import { store } from './store/store';

const App = () => {
  const [selected, setSelected] = useState("my-music");

  enum ContentTab {
    MY_MUSIC = "my-music",
    SEARCH = "search",
  }

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
                          selected={selected === ContentTab.MY_MUSIC}
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
                      hidden={selected !== ContentTab.MY_MUSIC}
                    >
                      <MyMusicPanel />
                    </Group>

                    <Group
                      id="tab-content-search"
                      aria-labelledby="tab-search"
                      role="tabpanel"
                      hidden={selected !== ContentTab.SEARCH}
                    >
                      <SearchPanel />
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

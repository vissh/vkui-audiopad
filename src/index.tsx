import '@vkontakte/vkui/dist/vkui.css';

import {
  AdaptivityProvider, AppRoot, ConfigProvider, Group, Panel, PanelHeader, Platform, SplitCol,
  SplitLayout, Tabs, TabsItem, View, WebviewType
} from '@vkontakte/vkui';
import { useState } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import { MyMusic } from './components/MyMusic';
import { store } from './store/store';

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
                      <MyMusic />
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

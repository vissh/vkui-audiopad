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


const App = () => {
  const [tracks, setTracks] = useState<ITrackItems>({items: []} as ITrackItems);

  return (
    <ConfigProvider
      platform={Platform.ANDROID}
      webviewType={WebviewType.INTERNAL}
    >
      <AdaptivityProvider>
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
      </AdaptivityProvider>
    </ConfigProvider>
  );
};

ReactDOM.render(
  <App />,
  document.getElementById("root")
);

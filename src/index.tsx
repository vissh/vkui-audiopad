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
  const [tracks, setTracks] = useState<ITrackItems>({
    items: [
      // {
      //   image: "https://pp.userapi.com/c841025/v841025503/617f7/bkN1Def0s14.jpg",
      //   artist: "Arctic Monkeys",
      //   title: "I Wanna Be Yours",
      // },
    ]
  } as ITrackItems)

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

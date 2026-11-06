import { commonTypes } from '@vk-audiopad/common'
import {
  AdaptivityProvider,
  AppRoot,
  ConfigProvider,
  Panel,
  Platform,
  SplitCol,
  SplitLayout,
  View
} from '@vkontakte/vkui'
import '@vkontakte/vkui/dist/vkui.css'
import { type FC } from 'react'
import { Player } from '@/widgets/player'
import { PlaylistDialogs } from '@/features/manage-playlists'
import { SignIn } from '@/features/sign-in'
import { AppModalRoot, themeAtom } from '@/entities/modal'
import { useAtomValue } from '@/shared/lib/atom'
import { Notification } from '@/shared/ui/notification'
import { Pages } from './Pages'
import { SessionQueryProvider } from './SessionQueryProvider'
import { usePlaybackShortcut } from './use-playback-shortcut'
import './base.css'

export const Application: FC = () => {
  usePlaybackShortcut()
  const theme = useAtomValue(themeAtom)

  return (
    <SessionQueryProvider>
      <ConfigProvider
        platform={Platform.ANDROID}
        hasCustomPanelHeaderAfter={false}
        colorScheme={theme === commonTypes.Theme.SYSTEM ? undefined : theme}
      >
        <AdaptivityProvider>
          <AppRoot>
            <SplitLayout center>
              <SplitCol
                maxWidth={1216}
                minWidth={780}
              >
                <View activePanel='vkaudiopad'>
                  <Panel id='vkaudiopad'>
                    <Player />
                    <SignIn />
                    <Pages />
                    <Notification />
                  </Panel>
                </View>
              </SplitCol>
              <AppModalRoot />
              <PlaylistDialogs />
            </SplitLayout>
          </AppRoot>
        </AdaptivityProvider>
      </ConfigProvider>
    </SessionQueryProvider>
  )
}

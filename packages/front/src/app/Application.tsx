import { commonTypes } from '@vk-audiopad/common'
import {
  AdaptivityProvider,
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
import { ApplicationViewport } from './ApplicationViewport'
import { Pages } from './Pages'
import { SessionQueryProvider } from './SessionQueryProvider'
import { usePlaybackShortcut } from './use-playback-shortcut'
import { useSystemColorScheme } from './use-system-color-scheme'
import './base.css'

export const Application: FC = () => {
  usePlaybackShortcut()
  const theme = useAtomValue(themeAtom)
  const systemColorScheme = useSystemColorScheme()

  return (
    <SessionQueryProvider>
      <ConfigProvider
        platform={Platform.ANDROID}
        hasCustomPanelHeaderAfter={false}
        colorScheme={theme === commonTypes.Theme.SYSTEM ? systemColorScheme : theme}
      >
        <AdaptivityProvider>
          <ApplicationViewport>
            <SplitLayout center>
              <SplitCol
                maxWidth={1216}
                minWidth={780}
              >
                <View activePanel='vkaudiopad'>
                  <Panel id='vkaudiopad'>
                    <a className='vkap_skip_link' href='#vkap-content'>Перейти к содержимому</a>
                    <a className='vkap_skip_link' href='#vkap-player'>Перейти к плееру</a>
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
          </ApplicationViewport>
        </AdaptivityProvider>
      </ConfigProvider>
    </SessionQueryProvider>
  )
}

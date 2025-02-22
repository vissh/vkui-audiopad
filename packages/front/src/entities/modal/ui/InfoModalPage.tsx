import { commonTypes } from '@vk-audiopad/common'
import {
  Icon28KeyboardOutline,
  Icon28LikeFillRed,
  Icon28MessageOutline,
  Icon28PaletteOutline
} from '@vkontakte/icons'
import {
  Group,
  Link,
  ModalPage,
  ModalPageHeader,
  PanelHeaderClose,
  Platform,
  Select,
  SimpleCell,
  useAdaptivityConditionalRender,
  usePlatform
} from '@vkontakte/vkui'
import { useAtom } from '@/shared/lib/atom'
import { themeAtom } from '../model/atom'

export const InfoModalPage = ({ ...props }) => {
  const platform = usePlatform()
  const { sizeX } = useAdaptivityConditionalRender()

  return (
    <ModalPage
      {...props}
      header={
        <ModalPageHeader
          before={
            sizeX.compact !== false &&
            platform === Platform.ANDROID &&
            <PanelHeaderClose className={sizeX.compact.className} />
          }
        >
          Настройки
        </ModalPageHeader>
      }
    >
      <Group>
        <ThemeSetting />
        <ShortcutInfo />
        <Rate />
        <FeedbackInfo />
        <SourceCode />
      </Group>
    </ModalPage>
  )
}

const ShortcutInfo = () => {
  const isFirefoxExtension = location.href.startsWith('moz-extension://')
  const firefoxLink = 'https://support.mozilla.org/ru/kb/menedzher-sochetaniya-klavish-dopolnenij-v-firefox'

  const description = isFirefoxExtension
    ? <span>
      Инструкция по настройке горячих клавиш{' '}
      <Link
        href={firefoxLink}
        target='_blank'
      >
        {firefoxLink}
      </Link>
      .
    </span>
    : <span>
      Настройка горячих клавиш доступна по адресу{' '}
      <b
        onClick={(e: React.MouseEvent) => {
          const selection = window.getSelection()
          if (selection != null) {
            const range = document.createRange()
            range.selectNode(e.currentTarget)
            selection.removeAllRanges()
            selection.addRange(range)
          }
        }}
      >
        chrome://extensions/shortcuts
      </b>
    </span>

  return (
    <SimpleCell
      before={<Icon28KeyboardOutline />}
      hasHover={false}
      hasActive={false}
      multiline
    >
      {description}
    </SimpleCell>
  )
}

const ThemeSetting = () => {
  const [theme, setTheme] = useAtom(themeAtom)

  return (
    <SimpleCell
      before={<Icon28PaletteOutline />}
      hasHover={false}
      hasActive={false}
      multiline
    >
      <Select
        title='Тема'
        style={{ width: '200px' }}
        value={theme}
        onChange={(e) => { setTheme(e.target.value as commonTypes.Theme) }}
        options={[
          { label: 'Системная', value: commonTypes.Theme.SYSTEM },
          { label: 'Светлая', value: commonTypes.Theme.LIGHT },
          { label: 'Тёмная', value: commonTypes.Theme.DARK }
        ]}
      />
    </SimpleCell>
  )
}

const FeedbackInfo = () => {
  return (
    <SimpleCell
      before={<Icon28MessageOutline />}
      hasHover={false}
      hasActive={false}
      multiline
    >
      О проблемах и пожеланиях пишите в группу{' '}
      <Link
        href='https://vk.me/vkaudiopad'
        target='_blank'
      >
        https://vk.me/vkaudiopad
      </Link>
    </SimpleCell>
  )
}

const Rate = () => {
  const isFirefoxExtension = location.href.startsWith('moz-extension://')
  const chromeLink = (
    <Link
      href='https://chrome.google.com/webstore/detail/plclpmphdjmdgmdpfkcmdkmohgpfecip'
      target='_blank'
    >
      https://chrome.google.com/
    </Link>
  )
  const firefoxLink = (
    <Link
      href='https://addons.mozilla.org/ru/firefox/addon/vkaudiopad/'
      target='_blank'
    >
      https://addons.mozilla.org/
    </Link>
  )

  return (
    <SimpleCell
      before={<Icon28LikeFillRed />}
      hasHover={false}
      hasActive={false}
      multiline
    >
      Буду благодарен за вашу оценку на странице расширения {isFirefoxExtension ? firefoxLink : chromeLink}
    </SimpleCell>
  )
}

const SourceCode = () => {
  return (
    <SimpleCell
      hasHover={false}
      hasActive={false}
      multiline
    >
      Вступайте в <Link href="https://t.me/fuyoka" target="_blank">Telegram-канал</Link>, если хотите начать разрабатывать фичи для расширения и получать за это оплату!
      <br /><br />
      Исходный код <Link href="https://github.com/vissh/vkui-audiopad" target="_blank">https://github.com/vissh/vkui-audiopad</Link>
    </SimpleCell>
  )
}

import { commonTypes } from '@vk-audiopad/common'
import {
  Icon28FullscreenOutline,
  Icon28KeyboardOutline,
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
  Text,
  Textarea,
  useAdaptivityConditionalRender,
  usePlatform
} from '@vkontakte/vkui'
import { useAtom } from '@/shared/lib/atom'
import { themeAtom } from '../model/atom'

export const SettingsModalPage = ({ ...props }) => {
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
        <FullscreenMode />
      </Group>
    </ModalPage>
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

const ShortcutInfo = () => {
  const firefoxLink = 'https://support.mozilla.org/ru/kb/menedzher-sochetaniya-klavish-dopolnenij-v-firefox'

  const description = isFirefoxExtension()
    ? <Text>
      Инструкция по настройке горячих клавиш <Link href={firefoxLink} target='_blank'>{firefoxLink}</Link>.
    </Text>
    : <Text>
      Настройка горячих клавиш доступна по адресу: <Textarea readOnly onClick={autoSelect}>chrome://extensions/shortcuts</Textarea>
    </Text>

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

const FullscreenMode = () => {
  return (
    <SimpleCell
      before={<Icon28FullscreenOutline />}
      hasHover={false}
      hasActive={false}
      multiline
    >
      <Text>Полноэкранный режим доступен по адресу:</Text>
      <Textarea readOnly onClick={(autoSelect)}>{location.href}</Textarea>
      {isFirefoxExtension() ? null : <Text>Для ещё большего удобства, можете <Link href='https://support.google.com/chrome/answer/15085120' target='_blank'>создать ярлык</Link>.</Text>}
    </SimpleCell>
  )
}

const isFirefoxExtension = (): boolean => {
  return location.href.startsWith('moz-extension://')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const autoSelect = (e: any): void => {
  e.target.select()
}

import { commonTypes } from '@vk-audiopad/common'
import { Icon28FullscreenOutline, Icon28KeyboardOutline, Icon28PaletteOutline } from '@vkontakte/icons'
import {
  Group,
  FormItem,
  Input,
  Link,
  ModalPage,
  ModalPageHeader,
  PanelHeaderClose,
  Platform,
  Select,
  SimpleCell,
  Text,
  Tabs,
  TabsItem,
  useAdaptivityConditionalRender,
  usePlatform,
  type CustomModalProps,
  type OpenModalPageProps
} from '@vkontakte/vkui'
import { useId, useState, type MouseEvent } from 'react'
import { useAtom } from '@/shared/lib/atom'
import { themeAtom } from '../model/atom'
import { EqualizerSettings } from './EqualizerSettings'
import './SettingsModalPage.css'

export const SettingsModalPage = ({ modalProps, close }: CustomModalProps<OpenModalPageProps>) => {
  const id = useId()
  const [accessDialogOpen, setAccessDialogOpen] = useState(false)
  const [selected, setSelected] = useState(`${id}-sound`)
  const sections = [
    { key: 'sound', label: 'Звук' },
    { key: 'appearance', label: 'Внешний вид' },
    { key: 'controls', label: 'Управление' }
  ]
  const platform = usePlatform()
  const { sizeX } = useAdaptivityConditionalRender()

  return (
    <ModalPage
      {...modalProps}
      size={680}
      height='min(560px, calc(100vh - 32px))'
      settlingHeight={100}
      dynamicContentHeight={false}
      disableFocusTrap={accessDialogOpen}
      header={
        <>
          <ModalPageHeader
            before={
              sizeX.compact !== false &&
              platform === Platform.ANDROID &&
              <PanelHeaderClose className={sizeX.compact.className} onClick={() => { close() }} />
            }
          >
            Настройки
          </ModalPageHeader>
          <Tabs
            className='vkap_settings_tabs'
            mode='secondary'
            layoutFillMode='stretched'
            aria-label='Разделы настроек'
            selectedId={selected}
            onSelectedIdChange={setSelected}
          >
            {sections.map(section => (
              <TabsItem key={section.key} id={`${id}-${section.key}`} aria-controls={`${id}-${section.key}-panel`}>
                {section.label}
              </TabsItem>
            ))}
          </Tabs>
        </>
      }
    >
      {sections.map(section => (
        <div
          key={section.key}
          id={`${id}-${section.key}-panel`}
          role='tabpanel'
          aria-labelledby={`${id}-${section.key}`}
          hidden={selected !== `${id}-${section.key}`}
          tabIndex={0}
        >
          {selected === `${id}-${section.key}` && (
            section.key === 'sound'
              ? <EqualizerSettings onAccessDialogChange={setAccessDialogOpen} />
              : section.key === 'appearance'
                ? <Group><ThemeSetting /></Group>
                : <Group><ShortcutInfo /><TabMode /></Group>
          )}
        </div>
      ))}
    </ModalPage>
  )
}

const ThemeSetting = () => {
  const id = useId()
  const [theme, setTheme] = useAtom(themeAtom)
  return (
    <SimpleCell before={<Icon28PaletteOutline />} hasHover={false} hasActive={false}>
      <FormItem className='vkap_settings_theme' top='Тема' htmlFor={id} noPadding>
        <Select
          id={id}
          style={{ width: '100%' }}
          slotProps={{ input: { 'aria-label': 'Тема' }, select: { 'aria-label': 'Тема' } }}
          value={theme}
          onChange={event => { setTheme(event.target.value as commonTypes.Theme) }}
          options={[
            { label: 'Системная', value: commonTypes.Theme.SYSTEM },
            { label: 'Светлая', value: commonTypes.Theme.LIGHT },
            { label: 'Тёмная', value: commonTypes.Theme.DARK }
          ]}
        />
      </FormItem>
    </SimpleCell>
  )
}

const ShortcutInfo = () => (
  <SimpleCell before={<Icon28KeyboardOutline />} hasHover={false} hasActive={false} multiline>
    <Text>Горячие клавиши</Text>
    {isFirefoxExtension()
      ? <Link href='https://support.mozilla.org/ru/kb/menedzher-sochetaniya-klavish-dopolnenij-v-firefox' target='_blank' rel='noreferrer'>Как настроить в Firefox</Link>
      : <Input style={{ width: 320, maxWidth: '100%' }} readOnly value='chrome://extensions/shortcuts' slotProps={{ input: { 'aria-label': 'Адрес настройки горячих клавиш', onClick: autoSelect } }} />}
  </SimpleCell>
)

const TabMode = () => (
  <SimpleCell
    before={<Icon28FullscreenOutline />}
    hasHover={false}
    hasActive={false}
    multiline
    subtitle={isFirefoxExtension() ? undefined : <Link href='https://support.google.com/chrome/answer/15085120' target='_blank' rel='noreferrer'>Как создать ярлык плеера</Link>}
  >
    <Link href={location.href} target='_blank' rel='noreferrer'>Открыть плеер в отдельной вкладке</Link>
  </SimpleCell>
)

const isFirefoxExtension = (): boolean => location.href.startsWith('moz-extension://')
const autoSelect = (event: MouseEvent<HTMLInputElement>): void => { event.currentTarget.select() }

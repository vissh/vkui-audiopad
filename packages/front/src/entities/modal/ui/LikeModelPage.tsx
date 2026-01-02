import {
  Icon16BugOutline,
  Icon16LikeOutline,
  Icon16ShareOutline,
  Icon16StarAlt,
  Icon16SubscriptionsOutline,
  Icon16WorkOutline
} from '@vkontakte/icons'
import {
  Cell,
  FormItem,
  FormLayoutGroup,
  Link,
  List,
  ModalPage,
  ModalPageHeader,
  PanelHeaderClose,
  Platform,
  Text,
  useAdaptivityConditionalRender,
  usePlatform
} from '@vkontakte/vkui'

export const LikeModalPage = ({ ...props }) => {
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
          Дорогие пользователи!
        </ModalPageHeader>
      }
    >
      <FormLayoutGroup>
        <FormItem>
          <Text>
            Если вам нравится расширение, я буду очень благодарен за вашу поддержку!
            Ваши отзывы и оценки помогают проекту становиться лучше.
            Если у вас есть замечания или пожелания, напишите мне напрямую: <Link href='https://vk.me/vkaudiopad' target='_blank'>https://vk.me/vkaudiopad</Link>. Я постараюсь ответить как можно быстрее.
          </Text>
        </FormItem>

        <FormItem>
          <Text>
            Для поддержки вы можете:
          </Text>
          <List>
            <Cell
              multiline
              before={<Icon16LikeOutline />}
              subtitle='Буду признателен за пять звезд.'
            >
              Оценить в магазине {storeLink()} и написать отзыв
            </Cell>
            <Cell
              multiline
              before={<Icon16SubscriptionsOutline />}
              subtitle='Следите за обновлениями, участвуйте в обсуждениях, создавайте темы.'
            >
              Подписаться на сообщество <Link href='https://vk.com/vkaudiopad' target='_blank'>https://vk.com/vkaudiopad</Link>
            </Cell>
            <Cell
              multiline
              before={<Icon16ShareOutline />}
              subtitle={<>Расскажите друзьям — это лучшая помощь.</>}
            >
              Поделиться <Link target='_blank' href='https://vk.com/share.php?url=https%3A%2F%2Fchromewebstore.google.com%2Fdetail%2Fplclpmphdjmdgmdpfkcmdkmohgpfecip&title=VK%20Audiopad%20%E2%80%93%20%D1%80%D0%B0%D1%81%D1%88%D0%B8%D1%80%D0%B5%D0%BD%D0%B8%D0%B5%20%D0%B4%D0%BB%D1%8F%20%D0%B1%D0%B5%D1%81%D0%BF%D0%BB%D0%B0%D1%82%D0%BD%D0%BE%D0%B3%D0%BE%20%D0%BF%D1%80%D0%BE%D1%81%D0%BB%D1%83%D1%88%D0%B8%D0%B2%D0%B0%D0%BD%D0%B8%D1%8F%20VK%20%D0%9C%D1%83%D0%B7%D1%8B%D0%BA%D0%B8%20%D0%B8%20%D0%B1%D0%B5%D0%B7%20%D1%80%D0%B5%D0%BA%D0%BB%D0%B0%D0%BC%D1%8B'>ссылкой</Link> на расширение
            </Cell>
          </List>
        </FormItem>

        <FormItem>
          <Text>Код проекта открыт на GitHub <Link href='https://github.com/vissh/vkui-audiopad' target='_blank'>https://github.com/vissh/vkui-audiopad</Link>.</Text>
          <Text>Вы можете проявить активность и по части продвижения open source:</Text>
          <List>
            <Cell
              multiline
              before={<Icon16StarAlt />}
              subtitle='Поставьте звездочку — чтобы проект стал заметнее.'
            >
              Поставить звезду
            </Cell>
            <Cell
              multiline
              before={<Icon16BugOutline />}
              subtitle='Создайте Issue — если нашли баг или есть идеи.'
            >
              Сообщить о проблеме
            </Cell>
            <Cell
              multiline
              before={<Icon16WorkOutline />}
              subtitle='Создайте Pull Request — если хотите помочь с кодом.'
            >
              Внести вклад
            </Cell>
          </List>
        </FormItem>

      </FormLayoutGroup>
    </ModalPage>
  )
}

const storeLink = (): React.ReactNode => {
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
  return isFirefoxExtension ? firefoxLink : chromeLink
}

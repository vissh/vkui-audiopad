import { Icon56LogoVk } from '@vkontakte/icons'
import {
  Button,
  Group,
  Link,
  ModalPage,
  Placeholder
} from '@vkontakte/vkui'

export const SignInModalPage = ({ ...props }) => {
  return (
    <ModalPage
      {...props}
      hideCloseButton={true}
    >
      <Group>
        <Placeholder
          icon={<Icon56LogoVk />}
          header='Вход ВКонтакте'
          action={
            <Link
              href='https://vk.com/'
              target='_blank'
            >
              <Button size='m'>Перейти на сайт</Button>
            </Link>
          }
        >
          Авторизуйтесь на сайте vk.com для использования расширения
        </Placeholder>
      </Group>
    </ModalPage>
  )
}

import { Icon24ExternalLinkOutline, Icon56ErrorOutline } from '@vkontakte/icons'
import { FormItem, Group, Link, Panel, PanelSpinner, Placeholder, Textarea } from '@vkontakte/vkui'
import { type FC, type ReactNode } from 'react'
import { serializeError } from 'serialize-error'

interface ContentProps {
  display: boolean
  loading?: boolean
  hideLoader?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any | null
  children: ReactNode
}

export const Content: FC<ContentProps> = ({
  display,
  loading = false,
  hideLoader = false,
  error,
  children
}) => {
  return (
    <span style={{ display: display ? 'block' : 'none' }}>
      {children}
      {loading && !hideLoader && <Loading />}
      {error != null && <ErrorResult error={error} />}
    </span>
  )
}

const Loading: FC = () => {
  return (
    <Panel>
      <PanelSpinner />
    </Panel>
  )
}

interface ErrorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any
}

const ErrorResult: FC<ErrorProps> = ({ error }) => {
  console.error(error)
  const link = (
    <Link
      href='https://vk.me/vkaudiopad'
      target='_blank'
    >
      группу{' '}
      <Icon24ExternalLinkOutline
        width={16}
        height={16}
      />
    </Link>
  )

  return (
    <Group>
      <Placeholder icon={<Icon56ErrorOutline />}>
        К сожалению, получение данных завершилось с ошибкой, повторите попытку позже.
        <br />
        Если ошибка не пропадает, скопируйте данные и отправьте сообщение в {link}. Спасибо!
        <br />

        <FormItem top='Скопируйте информацию об ошибке' topComponent='h5'>
          <Textarea value={JSON.stringify(serializeError(error))} />
        </FormItem>

      </Placeholder>
    </Group>
  )
}

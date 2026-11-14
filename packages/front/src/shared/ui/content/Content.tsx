import { Icon24ExternalLinkOutline, Icon56ErrorOutline } from '@vkontakte/icons'
import { Button, Group, Link, Panel, PanelSpinner, Placeholder } from '@vkontakte/vkui'
import { type FC, type ReactNode } from 'react'
import { createErrorReport, errorHint } from '../../lib/error-report'
import { ErrorReport } from '../error-report'

interface ContentProps {
  display: boolean
  loading?: boolean
  hideLoader?: boolean

  error?: unknown
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
    <div hidden={!display} inert={!display}>
      {children}
      {loading && !hideLoader && <Loading />}
      {error != null && <ErrorResult error={error} />}
    </div>
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
  error: unknown
}

const ErrorResult: FC<ErrorProps> = ({ error }) => {
  console.error(createErrorReport(error))
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
      <Placeholder
        icon={<Icon56ErrorOutline />}
        action={
          <>
            <Button mode='secondary' onClick={() => { location.reload() }}>Обновить интерфейс</Button>
            <ErrorReport error={error} />
          </>
        }
      >
        {errorHint(error)}
        <br />
        Если ошибка не пропадает, скопируйте информацию об ошибке и отправьте сообщение в {link}
      </Placeholder>
    </Group>
  )
}

import { Header, Link, Skeleton } from '@vkontakte/vkui'
import { type FC } from 'react'

interface ShowAllLinkProps {
  title: string
  showLink: boolean
  onClick: () => void
}

export const ShowAllLink: FC<ShowAllLinkProps> = ({ title, showLink, onClick }) => {
  return (
    <Header after={showLink && <Link onClick={onClick}>Показать все</Link>}>
      {title}
    </Header>
  )
}

export const ShowAllLinkSkeleton: FC = () => {
  return (
    <Header after={<Skeleton width={90} />}>
      {<Skeleton width={75} />}
    </Header>
  )
}

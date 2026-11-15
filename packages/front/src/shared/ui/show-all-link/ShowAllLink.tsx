import { Header, Link } from '@vkontakte/vkui'
import { type FC } from 'react'
import { LoadingPlaceholder as Skeleton } from '../loading-placeholder'

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
      <Skeleton width={75} />
    </Header>
  )
}

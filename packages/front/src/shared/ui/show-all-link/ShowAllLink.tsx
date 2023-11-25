import { Header, Link } from '@vkontakte/vkui'
import { type FC } from 'react'

interface ShowAllLinkProps {
  title: string
  showLink: boolean
  onClick: () => void
}

export const ShowAllLink: FC<ShowAllLinkProps> = ({ title, showLink, onClick }) => {
  return (
    <Header aside={showLink && <Link onClick={onClick}>Показать все</Link>}>
      {title}
    </Header>
  )
}

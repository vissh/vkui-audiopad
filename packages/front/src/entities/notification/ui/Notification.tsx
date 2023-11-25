import { type FC } from 'react'
import { useNotification } from '../model/atom'

export const Notification: FC = () => {
  return useNotification()
}

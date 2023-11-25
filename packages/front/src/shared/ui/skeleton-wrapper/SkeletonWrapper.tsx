import { Group } from '@vkontakte/vkui'
import { type FC } from 'react'

interface SkeletonWrapperProps {
  mode: 'plain' | 'card'
  isLoading: boolean
  skeleton: React.ReactNode
  children: React.ReactNode
}

export const SkeletonWrapper: FC<SkeletonWrapperProps> = ({ mode, isLoading, skeleton, children }) => {
  return (
    <>
      {isLoading && <Group mode={mode}>{skeleton}</Group>}
      {children}
    </>
  )
}

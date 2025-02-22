import { type FC } from 'react'

interface SkeletonWrapperProps {
  isPending: boolean
  skeleton: React.ReactNode
  children: React.ReactNode
}

export const SkeletonWrapper: FC<SkeletonWrapperProps> = ({ isPending, skeleton, children }) => {
  return (
    <>
      {isPending && <>{skeleton}</>}
      {children}
    </>
  )
}

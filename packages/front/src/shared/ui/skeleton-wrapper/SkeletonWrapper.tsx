import { type FC } from 'react'

interface SkeletonWrapperProps {
  isLoading: boolean
  skeleton: React.ReactNode
  children: React.ReactNode
}

export const SkeletonWrapper: FC<SkeletonWrapperProps> = ({ isLoading, skeleton, children }) => {
  return (
    <>
      {isLoading && <>{skeleton}</>}
      {children}
    </>
  )
}

import { type FC } from 'react'

interface SkeletonWrapperProps {
  isPending: boolean
  skeleton: React.ReactNode
  children: React.ReactNode
}

export const SkeletonWrapper: FC<SkeletonWrapperProps> = ({ isPending, skeleton, children }) => {
  return (
    <>
      {isPending ? <div role='status' aria-label='Загрузка' aria-busy='true'><div aria-hidden='true' inert>{skeleton}</div></div> : <>{children}</>}
    </>
  )
}

import { type FC } from 'react'
import { useUpdateWebToken } from '../model/hooks'
import { Welcome } from './Welcome'

interface SignInProps {
  children: React.ReactNode
}

export const SignIn: FC<SignInProps> = ({ children }) => {
  const { data: webToken } = useUpdateWebToken()

  const signedIn: boolean = webToken?.error == null

  return <>{signedIn ? children : <Welcome />}</>
}

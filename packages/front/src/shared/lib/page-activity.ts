import { createContext, useContext } from 'react'

export const PageActivityContext = createContext(true)

export const usePageActive = () => useContext(PageActivityContext)

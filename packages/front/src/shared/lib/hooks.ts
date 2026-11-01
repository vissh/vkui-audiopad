import { useEffect, useRef } from 'react'

type Timer = ReturnType<typeof setTimeout>

export const useDebounce = <T extends unknown[]>(func: (...args: T) => void, delay: number): (...args: T) => void => {
  const timer = useRef<Timer | undefined>(undefined)

  useEffect(() => {
    return () => { clearTimeout(timer.current) }
  }, [])

  return (...args): void => {
    const newTimer = setTimeout(() => { func(...args) }, delay)
    clearTimeout(timer.current)
    timer.current = newTimer
  }
}

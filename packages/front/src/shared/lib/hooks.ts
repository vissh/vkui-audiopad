import { useEffect, useRef } from 'react'

type Timer = ReturnType<typeof setTimeout>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useDebounce = <T extends any[]>(func: (...args: T) => void, delay: number): (...args: T) => void => {
  const timer = useRef<Timer>()

  useEffect(() => {
    return () => { clearTimeout(timer.current) }
  }, [])

  return (...args): void => {
    const newTimer = setTimeout(() => { func(...args) }, delay)
    clearTimeout(timer.current)
    timer.current = newTimer
  }
}

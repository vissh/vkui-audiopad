import { commonTypes } from '@vk-audiopad/common'
import { Search } from '@vkontakte/vkui'
import { memo, useEffect, useRef } from 'react'
import { openSearchPage, selectedTabAtom } from '@/entities/content-tab'
import { atom, useAtom } from '@/shared/lib/atom'
import { useDebounce } from '@/shared/lib/hooks'

const autoFocusAtom = atom(false)
const valueAtom = atom('')

selectedTabAtom.watch((selectedTab) => {
  if (selectedTab.tab === commonTypes.ContentTab.SEARCH && selectedTab.value.length > 0) {
    valueAtom.set(selectedTab.value)
  }

  if (selectedTab.tab !== commonTypes.ContentTab.SEARCH && selectedTab.tab !== commonTypes.ContentTab.UNKNOWN) {
    autoFocusAtom.set(false)
    valueAtom.set('')
  }
})

export const SearchInput = memo(function SearchInput () {
  const [autoFocus, setAutoFocus] = useAtom(autoFocusAtom)

  const [value, setValue] = useAtom(valueAtom)
  const inputRef = useRef<HTMLInputElement>(null)

  const setSearchValueToStorage = useDebounce((value: string) => {
    if (value.length > 0) {
      openSearchPage(value)
    }
  }, 600)

  useEffect(() => {
    autoFocus ? inputRef.current?.focus() : inputRef.current?.blur()
  }, [autoFocus])

  return (
    <Search
      getRef={inputRef}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        setAutoFocus(true)
        setValue(e.target.value)
        setSearchValueToStorage(e.target.value)
      }}
    />
  )
})

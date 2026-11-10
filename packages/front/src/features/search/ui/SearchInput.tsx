import { commonTypes } from '@vk-audiopad/common'
import { Search } from '@vkontakte/vkui'
import { memo, useEffect, useRef } from 'react'
import { atom, useAtom } from '@/shared/lib/atom'
import { useDebounce } from '@/shared/lib/hooks'
import { usePageActive } from '@/shared/lib/page-activity'
import { onActiveTabChanged, openSearchPage } from '@/shared/model'

const autoFocusAtom = atom(false)
const valueAtom = atom('')

onActiveTabChanged((activeTab) => {
  if (activeTab.tab === commonTypes.ContentTab.SEARCH && activeTab.value.length > 0) {
    valueAtom.set(activeTab.value)
  }

  if (activeTab.tab !== commonTypes.ContentTab.SEARCH && activeTab.tab !== commonTypes.ContentTab.UNKNOWN) {
    autoFocusAtom.set(false)
    valueAtom.set('')
  }
})

export const SearchInput = memo(function SearchInput () {
  const active = usePageActive()
  const [autoFocus, setAutoFocus] = useAtom(autoFocusAtom, active)

  const [value, setValue] = useAtom(valueAtom, active)
  const inputRef = useRef<HTMLInputElement>(null)

  const setSearchValueToStorage = useDebounce((value: string) => {
    if (value.length > 0) {
      openSearchPage(value)
    }
  }, 600)

  useEffect(() => {
    if (!active) return
    autoFocus ? inputRef.current?.focus() : inputRef.current?.blur()
  }, [active, autoFocus])

  return (
    <Search
      slotProps={{
        input: {
          'aria-label': 'Поиск музыки',
          getRootRef: inputRef
        }
      }}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        setAutoFocus(true)
        setValue(e.target.value)
        setSearchValueToStorage(e.target.value)
      }}
      noPadding={true}
    />
  )
})

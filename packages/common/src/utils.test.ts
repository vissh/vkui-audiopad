import { describe, expect, it } from 'vitest'
import { ContentTab } from './types'
import { assertUnreachable, isTabWithHistory, toHHMMSS } from './utils'

describe('toHHMMSS', () => {
  it('formats minutes and seconds below one hour', () => {
    expect(toHHMMSS(0)).toBe('0:00')
    expect(toHHMMSS(59)).toBe('0:59')
    expect(toHHMMSS(61)).toBe('1:01')
    expect(toHHMMSS(599)).toBe('9:59')
    expect(toHHMMSS(3599)).toBe('59:59')
  })

  it('formats hours and minutes starting from one hour', () => {
    expect(toHHMMSS(3600)).toBe('1:00')
    expect(toHHMMSS(3661)).toBe('1:01')
  })
})

describe('assertUnreachable', () => {
  it('throws on unreachable statement', () => {
    expect(() => assertUnreachable(undefined as never)).toThrow('unreachable')
  })
})

describe('isTabWithHistory', () => {
  it('returns true for tab with history', () => {
    expect(isTabWithHistory({ tab: ContentTab.ARTIST, id: '1', name: 'Name', history: [] })).toBe(true)
  })

  it('returns false for tab without history', () => {
    expect(isTabWithHistory({ tab: ContentTab.GENERAL })).toBe(false)
  })
})

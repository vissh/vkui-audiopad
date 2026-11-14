// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { getText } from '@/shared/lib/cast-to-types'

afterEach(() => { vi.restoreAllMocks() })

it.each([
  '', 'Plain title', 'Artist — Song 🎵', 'A > B', 'Line one\nline two', '\u00a0Title', '\ud800',
  '  Leading spaces', '\tLeading tab', '\nLeading newline', ' \t\n', 'A\r\nB', 'A\0B',
  'Artist &amp; Co', '&#x1f3b5;', '<b>Title</b> &amp; artist', '<!-- hidden -->Visible', '<title>Title</title>Body'
])('preserves HTML text decoding for %j', input => {
  const expected = new DOMParser().parseFromString(input, 'text/html').documentElement.textContent ?? ''
  expect(getText(input)).toBe(expected)
})

it('does not create HTML documents for ordinary track names', () => {
  const parse = vi.spyOn(DOMParser.prototype, 'parseFromString')
  for (const input of ['Track title', 'Artist — name', 'Line one\nline two', '']) expect(getText(input)).toBe(input)
  expect(parse).not.toHaveBeenCalled()
  expect(getText('Artist &amp; Co')).toBe('Artist & Co')
  expect(parse).toHaveBeenCalledOnce()
})

// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { parseFromString } from '@/shared/lib/utils'

it('makes legacy event attributes inert while preserving quoted markup and catalog metadata', () => {
  const html = '<div data-id="block" title="text onclick=keep > value" ONCLICK="return false"><img src="https://images.invalid/cover.png" onerror=\'this.src="fallback"\'><span onmouseover=hover()>Title &amp; artist</span></div>'
  const doc = parseFromString(html)
  expect(doc.querySelector('[onclick],[onerror],[onmouseover]')).toBeNull()
  expect(doc.querySelector('[data-id=block]')?.getAttribute('title')).toBe('text onclick=keep > value')
  expect(doc.querySelector('img')?.getAttribute('src')).toBe('https://images.invalid/cover.png')
  expect(doc.querySelector('span')?.textContent).toBe('Title & artist')
  expect(doc.querySelector('[data-vkap-inert-ONCLICK]')).not.toBeNull()
})

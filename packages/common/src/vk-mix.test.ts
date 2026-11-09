import { expect, it } from 'vitest'
import { parseSettings, selectionFromOptions, serializeOptions, toggleOption } from './vk-mix'

const payload = {
  response: {
    settings: {
      title: 'Настроить VK Микс',
      multi_select: true,
      mix_categories: [
        { id: 'vibes', title: 'Настроение', options: [{ id: 'happy', title: 'Радостно', selected: false }, { id: 'sad', title: 'Грустно', selected: true }] },
        { id: 'langs', title: 'Язык', options: [{ id: 'ru', title: 'Русский', selected: false }] }
      ]
    }
  }
}

it('parses the server schema and restores only supported options while preserving a genre', () => {
  const settings = parseSettings(payload)
  expect(selectionFromOptions(settings)).toEqual({ vibes: ['sad'], langs: [] })
  expect(selectionFromOptions(settings, JSON.stringify({ additionals: ['rock'], vibes: ['happy', 'unknown'], langs: ['ru'] }))).toEqual({ additionals: ['rock'], vibes: ['happy'], langs: ['ru'] })
  expect(selectionFromOptions(settings, '{}')).toEqual({ vibes: [], langs: [] })
})

it('selects at most one option per category, toggles it off and retains other categories', () => {
  const settings = parseSettings(payload)
  const selection = { vibes: ['sad'], langs: ['ru'], additionals: ['rock'] }
  const next = toggleOption(settings, selection, 'vibes', 'happy')
  expect(next).toEqual({ vibes: ['happy'], langs: ['ru'], additionals: ['rock'] })
  expect(selection.vibes).toEqual(['sad'])
  expect(toggleOption(settings, next, 'vibes', 'happy').vibes).toEqual([])
  expect(toggleOption({ ...settings, multiSelect: false }, selection, 'vibes', 'happy')).toEqual({ vibes: ['happy'] })
  expect(toggleOption(settings, selection, 'vibes', 'missing')).toBe(selection)
  expect(JSON.parse(serializeOptions(next))).toMatchObject({ id: expect.any(Number), vibes: ['happy'], langs: ['ru'], additionals: ['rock'] })
  expect(Object.keys(JSON.parse(serializeOptions({ vibes: [] })))).toEqual(['id'])
})

it.each([{}, { response: { settings: { title: 'Mix', mix_categories: [] } } }, { response: { settings: { title: 'Mix', mix_categories: [{ id: '__proto__', title: 'Unsafe', options: [] }] } } }])('rejects malformed settings: %j', value => {
  expect(() => parseSettings(value)).toThrow('format')
})

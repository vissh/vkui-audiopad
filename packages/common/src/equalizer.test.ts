import { expect, it } from 'vitest'
import { defaults, headroom, normalize, outputPreamp, peakBoost, presets, shouldAnnounceUpgrade, isMixSource } from './equalizer'

it('uses neutral disabled settings for missing and malformed storage', () => {
  for (const value of [undefined, null, false, 'bass', {}, { enabled: 1, gains: 'bad' }]) {
    expect(normalize(value)).toEqual(defaults)
  }
  expect(normalize({ enabled: true, gains: [Infinity, -50, 50, 1.6, '2', 0, 0, 0, 0, 0], preamp: Infinity })).toEqual({ ...defaults, enabled: true, gains: [0, -12, 12, 2, 0, 0, 0, 0, 0, 0] })
  expect(normalize({ gains: new Array(5) }).gains).toEqual(defaults.gains)
  expect(normalize({ gains: [3] }).gains).toEqual([3, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  expect(normalize({ preamp: -30, autoGain: false }).preamp).toBe(-12)
  expect(normalize({ preamp: 30 }).preamp).toBe(12)
})

it('returns independent settings and preserves every ten-band preset through normalization', () => {
  const first = normalize(undefined)
  first.gains[0] = 12
  expect(normalize(undefined)).toEqual(defaults)
  for (const gains of Object.values(presets)) expect(normalize({ enabled: true, gains })).toEqual({ ...defaults, enabled: true, gains })
})

it('migrates five-band built-ins by identity and interpolates custom curves on a log axis', () => {
  expect(normalize({ enabled: true, gains: [6, 4, 0, -1, 0] })).toEqual({ ...defaults, enabled: true, gains: presets.bass })
  expect(normalize({ gains: [0, 3, 6, 9, 12] }).gains).toEqual([0, 0, 2, 3, 5, 6, 8, 9, 11, 12])
  const settings = normalize({ gains: [0, 3, 6, 9, 12], savedGains: [6, 4, 0, -1, 0] })
  expect(settings.userPresets[0].gains).toEqual(presets.bass)
  expect(settings.userPresets[0].preamp).toBe(0)
  expect(normalize(settings)).toEqual(settings)
})

it('compensates the combined filter response while keeping manual Preamp independent', () => {
  const settings = { ...defaults, enabled: true, gains: presets.bass, preamp: 6, autoGain: true }
  expect(peakBoost(presets.bass)).toBeGreaterThan(6.8)
  expect(peakBoost(presets.bass)).toBeLessThan(7.3)
  expect(outputPreamp(settings)).toBeCloseTo(6 - peakBoost(presets.bass))
  expect(headroom(settings)).toBeCloseTo(10 ** ((6 - peakBoost(presets.bass)) / 20))
  expect(headroom({ ...settings, autoGain: false })).toBeCloseTo(10 ** (6 / 20))
  expect(headroom({ ...settings, enabled: false, autoGain: false })).toBe(1)
  expect(outputPreamp({ ...settings, preamp: -12, gains: presets.flat })).toBe(-12)
})

it('leaves boost compensation off unless it was explicitly enabled', () => {
  expect(defaults.autoGain).toBe(false)
  expect(normalize({ enabled: true }).autoGain).toBe(false)
  expect(normalize({ autoGain: true }).autoGain).toBe(true)
})

it.each([
  ['3.3.9', '3.3.10', true], ['3.3.9', '3.3.11', true], ['3.3.9', '3.4.0', true], ['2.99.99', '4.0', true],
  ['3.3.9.5', '3.3.10.0', true], ['3.3', '3.3.10', true], ['3.3.10', '3.3.11', false],
  ['3.3.10.0', '4.0', false], ['3.4.0', '4.0.0', false], ['3.3.8', '3.3.9', false],
  ['3.3.11', '3.3.10', false], [undefined, '3.3.10', false], ['bad', '4.0', false]
])('announces only crossing the first EQ release: %s -> %s', (previous, current, expected) => {
  expect(shouldAnnounceUpgrade(previous, current)).toBe(expected)
})

it.each([
  ['https://vd123.okcdn.ru/audio.mp3', true], ['https://okcdn.ru/file', true],
  ['https://okcdn.ru.example.org/file', false], ['https://notokcdn.ru/file', false], ['invalid', false], [undefined, false]
])('recognizes the actual Mix CDN hostname: %s', (url, expected) => {
  expect(isMixSource(url)).toBe(expected)
})

it('migrates the personal preset and preserves an independent named collection', () => {
  const saved = [7, 4, 0, -1, 0, 0, 0, 0, 0, 0]
  const settings = normalize({ enabled: true, gains: presets.rock, savedGains: saved, savedPreamp: -3 })
  expect(settings.userPresets).toEqual([{ id: 'legacy-personal', name: 'Мой пресет', gains: saved, preamp: -3 }])
  saved[0] = -12
  expect(settings.userPresets[0].gains[0]).toBe(7)
  const two = normalize({ ...settings, userPresets: [...settings.userPresets, { id: 'headphones', name: '  Наушники  ', gains: presets.bass, preamp: -3 }] })
  expect(two.userPresets.map(preset => preset.name)).toEqual(['Мой пресет', 'Наушники'])
  expect(normalize(two)).toEqual(two)
  for (const savedGains of [null, 'bass', [1], [0, 0, NaN, 0, 0], new Array(10)]) {
    expect(normalize({ savedGains }).userPresets).toEqual([])
  }
  expect(normalize({ userPresets: [null, {}, { id: 'x', name: ' ', gains: presets.flat }] }).userPresets).toEqual([])
})

it('does not attenuate flat/cut-only curves and bounds overlapping boosts at different sample rates', () => {
  expect(peakBoost(presets.flat)).toBe(0)
  expect(peakBoost(presets.bass_reduce)).toBe(0)
  const single = [...presets.flat] as typeof presets.flat
  single[5] = 6
  expect(peakBoost(single)).toBeCloseTo(6.2, 0)
  for (const sampleRate of [32000, 44100, 48000, 96000]) {
    const peak = peakBoost([12, 12, 12, 12, 12, 12, 12, 12, 12, 12], sampleRate)
    expect(peak).toBeGreaterThan(12)
    expect(peak).toBeLessThan(40)
  }
})

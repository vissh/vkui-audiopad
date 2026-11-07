export const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000] as const
export type Gains = [number, number, number, number, number, number, number, number, number, number]

export interface UserPreset {
  id: string
  name: string
  gains: Gains
  preamp: number
}

export interface Settings {
  enabled: boolean
  gains: Gains
  preamp: number
  autoGain: boolean
  userPresets: UserPreset[]
  presetId: string
  mixAccessDenied?: boolean
}

export type Status = 'off' | 'waiting' | 'loading' | 'active' | 'unavailable'

export const defaults: Settings = { enabled: false, gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], preamp: 0, autoGain: false, userPresets: [], presetId: '', mixAccessDenied: false }
export const presets: Record<string, Gains> = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  bass: [6, 5, 4, 2, 0, 0, -1, -1, 0, 0],
  bass_reduce: [-6, -5, -4, -2, 0, 0, 0, 0, 0, 0],
  bright: [-1, -1, 0, 0, 0, 0, 2, 3, 4, 5],
  soft: [1, 1, 0, 0, -1, -1, -2, -3, -4, -5],
  vocal: [-3, -2, -1, 0, 2, 4, 3, 2, 0, -1],
  speech: [-5, -4, -3, -2, 1, 3, 3, 2, 0, -2],
  pop: [1, 1, 2, 2, 3, 3, 2, 1, 0, 0],
  rock: [4, 4, 3, 1, -1, -2, 0, 2, 3, 4],
  electronic: [5, 5, 4, 2, 0, -1, 1, 2, 3, 4],
  jazz: [2, 2, 1, 1, 0, 0, 1, 2, 3, 3],
  classical: [2, 2, 1, 1, 0, -1, 0, 1, 2, 2]
}

const legacyFrequencies = [60, 230, 910, 3600, 14000]
const legacyPresets: Record<string, number[]> = {
  flat: [0, 0, 0, 0, 0],
  bass: [6, 4, 0, -1, 0],
  bass_reduce: [-6, -3, 0, 0, 0],
  bright: [-1, 0, 0, 3, 5],
  soft: [1, 0, -1, -3, -5],
  vocal: [-2, 0, 4, 3, -1],
  speech: [-4, -2, 3, 2, -2],
  pop: [1, 2, 3, 1, 0],
  rock: [4, 2, -2, 2, 4],
  electronic: [5, 3, -1, 2, 4],
  jazz: [2, 1, 0, 2, 3],
  classical: [2, 1, -1, 1, 2]
}
const decibels = (value: unknown): number => typeof value === 'number' && Number.isFinite(value)
  ? Math.max(-12, Math.min(12, Math.round(value))) || 0
  : 0

const normalizeGains = (raw: unknown[]): Gains => {
  if (raw.length === 5) {
    const old = Array.from(raw, decibels)
    const preset = Object.keys(legacyPresets).find(key => legacyPresets[key].every((gain, index) => gain === old[index]))
    if (preset != null) return [...presets[preset]]
    // Approximate legacy custom curves on a logarithmic frequency axis.
    return frequencies.map(frequency => {
      const upper = legacyFrequencies.findIndex(value => value >= frequency)
      if (upper === 0) return old[0]
      if (upper === -1) return old[4]
      const ratio = Math.log(frequency / legacyFrequencies[upper - 1]) / Math.log(legacyFrequencies[upper] / legacyFrequencies[upper - 1])
      return decibels(old[upper - 1] + ratio * (old[upper] - old[upper - 1]))
    }) as Gains
  }
  return frequencies.map((_, index) => decibels(raw[index])) as Gains
}

const validSavedGains = (value: unknown): value is number[] => Array.isArray(value) && [5, 10].includes(value.length) && Array.from(value).every(item => typeof item === 'number' && Number.isFinite(item))

export const normalize = (value: unknown): Settings => {
  if (value == null || typeof value !== 'object') return { ...defaults, gains: [...defaults.gains], userPresets: [], presetId: '', mixAccessDenied: false }
  const enabled = 'enabled' in value && value.enabled === true
  const raw = 'gains' in value && Array.isArray(value.gains) ? value.gains : []
  const settings: Settings = {
    enabled,
    gains: normalizeGains(raw),
    preamp: decibels('preamp' in value ? value.preamp : 0),
    autoGain: 'autoGain' in value && value.autoGain === true,
    userPresets: [],
    mixAccessDenied: 'mixAccessDenied' in value && value.mixAccessDenied === true,
    presetId: 'presetId' in value && typeof value.presetId === 'string' ? value.presetId : ''
  }
  if ('userPresets' in value && Array.isArray(value.userPresets)) {
    for (const raw of value.userPresets) {
      if (raw == null || typeof raw !== 'object' || typeof raw.id !== 'string' || !raw.id.trim() || typeof raw.name !== 'string' || !raw.name.trim() || !validSavedGains(raw.gains)) continue
      const id = raw.id.trim().slice(0, 64)
      if (settings.userPresets.some(preset => preset.id === id)) continue
      settings.userPresets.push({ id, name: raw.name.trim().slice(0, 64), gains: normalizeGains(raw.gains), preamp: decibels(raw.preamp) })
    }
  }
  if ('savedGains' in value && validSavedGains(value.savedGains) && !settings.userPresets.some(preset => preset.id === 'legacy-personal')) {
    settings.userPresets.push({ id: 'legacy-personal', name: 'Мой пресет', gains: normalizeGains(value.savedGains), preamp: decibels('savedPreamp' in value ? value.savedPreamp : 0) })
  }
  if (!settings.userPresets.some(preset => preset.id === settings.presetId)) settings.presetId = ''
  return settings
}

export const isMixSource = (url: unknown): boolean => {
  if (typeof url !== 'string') return false
  try {
    const { protocol, hostname } = new URL(url)
    return protocol === 'https:' && (hostname === 'okcdn.ru' || hostname.endsWith('.okcdn.ru'))
  } catch { return false }
}

export const shouldAnnounceUpgrade = (previousVersion: unknown, currentVersion: unknown): boolean => {
  const parse = (value: unknown): number[] | null => {
    if (typeof value !== 'string' || !/^\d+(?:\.\d+){0,3}$/.test(value)) return null
    const parts = value.split('.').map(Number)
    return parts.every(part => part <= 65535) ? Array.from({ length: 4 }, (_, index) => parts[index] ?? 0) : null
  }
  const previous = parse(previousVersion)
  const current = parse(currentVersion)
  if (previous == null || current == null) return false
  const beforeRelease = (parts: number[]): boolean => {
    const release = [3, 3, 10, 0]
    const index = parts.findIndex((part, index) => part !== release[index])
    return index !== -1 && parts[index] < release[index]
  }
  return beforeRelease(previous) && !beforeRelease(current)
}

export const outputPreamp = (settings: Settings, sampleRate = 48000): number => settings.enabled
  ? settings.preamp - (settings.autoGain ? peakBoost(settings.gains, sampleRate) : 0)
  : 0

export const headroom = (settings: Settings, sampleRate = 48000): number => 10 ** (outputPreamp(settings, sampleRate) / 20)

// RBJ biquads match Web Audio's Q=1 peaking filters and slope=1 shelves.
export const peakBoost = (gains: Gains, sampleRate = 48000): number => {
  if (gains.every(gain => gain <= 0)) return 0
  const coefficients = frequencies.map((frequency, index) => {
    const a = 10 ** (gains[index] / 40)
    const w = 2 * Math.PI * Math.min(frequency, sampleRate * 0.45) / sampleRate
    const c = Math.cos(w)
    const alpha = Math.sin(w) / 2
    const beta = 2 * Math.sqrt(a) * alpha * Math.SQRT2
    if (index === 0) {
      return [
        a * (a + 1 - (a - 1) * c + beta), 2 * a * (a - 1 - (a + 1) * c), a * (a + 1 - (a - 1) * c - beta),
        a + 1 + (a - 1) * c + beta, -2 * (a - 1 + (a + 1) * c), a + 1 + (a - 1) * c - beta
      ]
    }
    if (index === frequencies.length - 1) {
      return [
        a * (a + 1 + (a - 1) * c + beta), -2 * a * (a - 1 + (a + 1) * c), a * (a + 1 + (a - 1) * c - beta),
        a + 1 - (a - 1) * c + beta, 2 * (a - 1 - (a + 1) * c), a + 1 - (a - 1) * c - beta
      ]
    }
    return [1 + alpha * a, -2 * c, 1 - alpha * a, 1 + alpha / a, -2 * c, 1 - alpha / a]
  })
  let peak = 0
  for (let index = 0; index <= 512; index++) {
    const frequency = index === 0 ? 0 : 20 * (sampleRate / 40) ** ((index - 1) / 511)
    const w = 2 * Math.PI * frequency / sampleRate
    const c = Math.cos(w)
    const c2 = Math.cos(2 * w)
    const sin = Math.sin(w)
    const sin2 = Math.sin(2 * w)
    let db = 0
    for (const [b0, b1, b2, a0, a1, a2] of coefficients) {
      const numerator = (b0 + b1 * c + b2 * c2) ** 2 + (b1 * sin + b2 * sin2) ** 2
      const denominator = (a0 + a1 * c + a2 * c2) ** 2 + (a1 * sin + a2 * sin2) ** 2
      db += 10 * Math.log10(numerator / denominator)
    }
    peak = Math.max(peak, db)
  }
  return Math.ceil((peak + 0.2) * 10) / 10
}

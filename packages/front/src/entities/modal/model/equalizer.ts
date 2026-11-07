import { equalizer } from '@vk-audiopad/common'
import { storageAtom } from '@/shared/lib/atom'

export const equalizerSettingsAtom = storageAtom<unknown>({ key: 'equalizer', initial: equalizer.defaults, compareObjects: false })
export const equalizerStatusAtom = storageAtom<unknown>({ key: 'equalizerStatus', initial: 'waiting', compareObjects: false })

export const equalizerPresetLabels: Record<string, string> = {
  flat: 'Ровный звук',
  bass: 'Больше баса',
  bass_reduce: 'Меньше баса',
  bright: 'Ярче',
  soft: 'Мягче',
  vocal: 'Вокал',
  speech: 'Речь',
  pop: 'Поп',
  rock: 'Рок',
  electronic: 'Электроника',
  jazz: 'Джаз',
  classical: 'Классика',
  custom: 'Ручная настройка'
}

export const selectedEqualizerPreset = (settings: equalizer.Settings): string => {
  const selected = settings.userPresets.find(preset => preset.id === settings.presetId)
  if (selected != null) return `user:${selected.id}`
  const builtIn = Object.entries(equalizer.presets).find(([, gains]) => settings.preamp === 0 && gains.every((gain, index) => gain === settings.gains[index]))?.[0]
  if (builtIn != null) return builtIn
  const personal = settings.userPresets.find(preset => preset.preamp === settings.preamp && preset.gains.every((gain, index) => gain === settings.gains[index]))
  if (personal != null) return `user:${personal.id}`
  return 'custom'
}

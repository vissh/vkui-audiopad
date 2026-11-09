import { VKApiError } from './vk-api-error'

export interface MixOption { id: string, title: string, selected: boolean }
export interface MixCategory { id: string, title: string, options: MixOption[] }
export interface MixSettings { title: string, subtitle: string, categories: MixCategory[], multiSelect: boolean }
export type MixSelection = Record<string, string[]>
export interface MixPreferences { options: string, title: string }

const object = (value: unknown): value is Record<string, unknown> => value != null && typeof value === 'object' && !Array.isArray(value)
const identifier = (value: unknown): value is string => typeof value === 'string' && /^[\w-]+$/.test(value) && !['__proto__', 'constructor', 'prototype'].includes(value)

export const parseSettings = (payload: unknown): MixSettings => {
  if (!object(payload) || !object(payload.response) || !object(payload.response.settings)) throw new VKApiError('format')
  const settings = payload.response.settings
  if (typeof settings.title !== 'string' || !Array.isArray(settings.mix_categories) || settings.mix_categories.length === 0) throw new VKApiError('format')
  const categories = settings.mix_categories.map((category): MixCategory => {
    if (!object(category) || !identifier(category.id) || typeof category.title !== 'string' || !Array.isArray(category.options) || category.options.length === 0) throw new VKApiError('format')
    const options = category.options.map((option): MixOption => {
      if (!object(option) || !identifier(option.id) || typeof option.title !== 'string' || typeof option.selected !== 'boolean') throw new VKApiError('format')
      return { id: option.id, title: option.title, selected: option.selected }
    })
    if (new Set(options.map(option => option.id)).size !== options.length) throw new VKApiError('format')
    return { id: category.id, title: category.title, options }
  })
  if (new Set(categories.map(category => category.id)).size !== categories.length) throw new VKApiError('format')
  return { title: settings.title, subtitle: typeof settings.subtitle === 'string' ? settings.subtitle : '', categories, multiSelect: settings.multi_select === true }
}

export const selectionFromOptions = (settings: MixSettings, options?: string): MixSelection => {
  let parsed: unknown
  try { parsed = JSON.parse(options ?? '') } catch { /* Use server defaults */ }
  const additionals = object(parsed) && Array.isArray(parsed.additionals) ? parsed.additionals.filter(identifier) : []
  return {
    ...(additionals.length > 0 ? { additionals } : {}),
    ...Object.fromEntries(settings.categories.map(category => {
      const values = object(parsed) ? parsed[category.id] : undefined
      return [category.id, category.options.filter(option => Array.isArray(values) ? values.includes(option.id) : options == null && option.selected).map(option => option.id).slice(0, 1)]
    }))
  }
}

export const toggleOption = (settings: MixSettings, selection: MixSelection, categoryId: string, optionId: string): MixSelection => {
  if (!settings.categories.some(category => category.id === categoryId && category.options.some(option => option.id === optionId))) return selection
  const active = selection[categoryId]?.includes(optionId) === true
  return { ...(settings.multiSelect ? selection : {}), [categoryId]: active ? [] : [optionId] }
}

export const serializeOptions = (selection: MixSelection): string => JSON.stringify({ id: Date.now(), ...Object.fromEntries(Object.entries(selection).filter(([, values]) => values.length > 0)) })

import { equalizer } from '@vk-audiopad/common'
import { Button, Footnote, FormItem, Input, Select, Checkbox, Tooltip, VisuallyHidden } from '@vkontakte/vkui'
import { useId, useState, type FormEvent, type KeyboardEvent, type PointerEvent } from 'react'
import { useAtom } from '@/shared/lib/atom'
import { equalizerPresetLabels, equalizerSettingsAtom, selectedEqualizerPreset } from '../model/equalizer'
import './Equalizer.css'

const bands = equalizer.frequencies.map(frequency => ({
  label: frequency < 1000 ? `${frequency} Гц` : `${frequency / 1000} кГц`,
  short: frequency < 1000 ? String(frequency) : `${frequency / 1000}k`
}))
const signed = (value: number): string => `${value > 0 ? '+' : ''}${value}`
const decibels = (value: number): string => `${signed(value)} дБ`

export const EqualizerPanel = () => {
  const id = useId()
  const [stored, setSettings] = useAtom(equalizerSettingsAtom)
  const [naming, setNaming] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const settings = equalizer.normalize(stored)
  const preset = selectedEqualizerPreset(settings)
  const personal = settings.userPresets.find(item => `user:${item.id}` === preset)
  const changed = personal != null && (personal.preamp !== settings.preamp || personal.gains.some((gain, index) => gain !== settings.gains[index]))
  const neutral = preset === 'flat' && settings.preamp === 0 && settings.gains.every(gain => gain === 0)

  const changeBand = (index: number, value: number): void => {
    const gains: equalizer.Gains = [...settings.gains]
    gains[index] = value
    setSettings({ ...settings, gains, presetId: personal?.id ?? '' })
  }

  const savePreset = (event: FormEvent): void => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) { setNameError('Введите название'); return }
    const duplicate = Object.values(equalizerPresetLabels).some(label => label.toLocaleLowerCase() === trimmed.toLocaleLowerCase()) || settings.userPresets.some(item => item.id !== editingId && item.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase())
    if (duplicate) { setNameError('Пресет с таким именем уже есть'); return }
    const id = editingId ?? crypto.randomUUID()
    const userPresets = editingId == null
      ? [...settings.userPresets, { id, name: trimmed, gains: [...settings.gains] as equalizer.Gains, preamp: settings.preamp }]
      : settings.userPresets.map(item => item.id === editingId ? { ...item, name: trimmed } : item)
    setSettings({ ...settings, userPresets, presetId: id })
    setNaming(false)
    setEditingId(null)
  }

  return (
    <section className='vkap_equalizer_panel' aria-label='Настройка эквалайзера'>
      <div className='vkap_equalizer_preset_row'>
        <FormItem noPadding style={{ flex: 1, minWidth: 0 }}>
          <VisuallyHidden Component='label' htmlFor={id}>Пресет</VisuallyHidden>
          <Select
            id={id}
            value={preset}
            options={[
              ...Object.keys(equalizer.presets).map(value => ({ value, label: equalizerPresetLabels[value] })),
              ...(settings.userPresets.length === 0 ? [] : [{ value: 'user-heading', label: 'Мои пресеты', disabled: true }]),
              ...settings.userPresets.map(item => ({ value: `user:${item.id}`, label: item.name })),
              { value: 'custom', label: equalizerPresetLabels.custom, disabled: true }
            ]}
            onChange={event => {
              const selected = settings.userPresets.find(item => `user:${item.id}` === event.target.value)
              const gains = selected?.gains ?? equalizer.presets[event.target.value]
              if (gains != null) setSettings({ ...settings, gains: [...gains], preamp: selected?.preamp ?? 0, presetId: selected?.id ?? '' })
              setNaming(false)
              setDeleting(false)
            }}
          />
        </FormItem>
        <Button size='m' mode='secondary' onClick={() => { setName(''); setEditingId(null); setNameError(''); setNaming(true); setDeleting(false) }}>Сохранить как…</Button>
      </div>
      {personal != null && !naming && !deleting && (
        <div className='vkap_equalizer_preset_actions'>
          {changed && <Button size='s' onClick={() => { setSettings({ ...settings, userPresets: settings.userPresets.map(item => item.id === personal.id ? { ...item, gains: [...settings.gains], preamp: settings.preamp } : item), presetId: personal.id }) }}>Сохранить изменения</Button>}
          <Button size='s' mode='tertiary' onClick={() => { setName(personal.name); setEditingId(personal.id); setNameError(''); setNaming(true) }}>Переименовать</Button>
          <Button size='s' mode='tertiary' onClick={() => { setDeleting(true) }}>Удалить пресет</Button>
        </div>
      )}
      {naming && (
        <form className='vkap_equalizer_naming' aria-label={editingId == null ? 'Новый пресет' : 'Переименовать пресет'} onSubmit={savePreset}>
          <FormItem top='Название пресета' htmlFor={`${id}-name`} noPadding status={nameError ? 'error' : 'default'} bottom={nameError || undefined}>
            <Input id={`${id}-name`} autoFocus value={name} maxLength={64} placeholder='Например, мои наушники' onChange={event => { setName(event.target.value); setNameError('') }} />
          </FormItem>
          <Button type='submit' size='m'>Сохранить</Button>
          <Button size='m' mode='tertiary' onClick={() => { setNaming(false) }}>Отмена</Button>
        </form>
      )}
      {deleting && personal != null && (
        <div className='vkap_equalizer_preset_actions' role='group' aria-label='Удаление пресета'>
          <Footnote>Удалить «{personal.name}»?</Footnote>
          <Button size='s' appearance='negative' onClick={() => { setSettings({ ...settings, userPresets: settings.userPresets.filter(item => item.id !== personal.id), presetId: '' }); setDeleting(false) }}>Удалить</Button>
          <Button size='s' mode='tertiary' onClick={() => { setDeleting(false) }}>Отмена</Button>
        </div>
      )}
      <div className='vkap_equalizer_plot'>
        <div className='vkap_equalizer_grid' aria-hidden='true'><span /><span /><span /><span /><span /></div>
        <EqualizerFader
          label='Preamp'
          short='Preamp'
          value={settings.preamp}
          className='vkap_equalizer_preamp'
          column={1}
          onChange={preamp => { setSettings({ ...settings, preamp, presetId: personal?.id ?? '' }) }}
        />
        <div className='vkap_equalizer_scale' aria-hidden='true'><span>+12</span><span>+6</span><span>0 дБ</span><span>−6</span><span>−12</span></div>
        {settings.gains.map((gain, index) => (
          <EqualizerFader column={index + 3} key={bands[index].label} label={bands[index].label} short={bands[index].short} value={gain} onChange={value => { changeBand(index, value) }} />
        ))}
      </div>
      <div className='vkap_equalizer_spectrum' aria-hidden='true'><span>Общий уровень</span><span>Бас</span><span>Середина</span><span>Высокие</span></div>
      <div className='vkap_equalizer_footer'>
        <Tooltip description='Уменьшает усиление по отклику фильтров, чтобы снизить риск искажений. Не выравнивает громкость треков. Preamp регулируется отдельно'>
          <Checkbox checked={settings.autoGain} onChange={event => { setSettings({ ...settings, autoGain: event.target.checked }) }}>Компенсация усиления</Checkbox>
        </Tooltip>
        <Button size='s' mode='tertiary' disabled={neutral} onClick={() => { setSettings({ ...settings, gains: [...equalizer.defaults.gains], preamp: 0, presetId: '' }); setNaming(false); setEditingId(null); setDeleting(false) }}>Сбросить</Button>
      </div>
    </section>
  )
}

interface FaderProps {
  label: string
  short: string
  value: number
  className?: string
  column: number
  onChange: (value: number) => void
}

const EqualizerFader = ({ label, short, value, className = '', column, onChange }: FaderProps) => {
  const change = (next: number): void => { onChange(Math.max(-12, Math.min(12, next))) }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const keys: Record<string, number> = {
      ArrowUp: value + 1,
      ArrowRight: value + 1,
      ArrowDown: value - 1,
      ArrowLeft: value - 1,
      PageUp: value + 3,
      PageDown: value - 3,
      Home: -12,
      End: 12
    }
    if (Object.prototype.hasOwnProperty.call(keys, event.key)) {
      event.preventDefault()
      change(keys[event.key])
    }
  }
  const changeFromPointer = (event: PointerEvent<HTMLDivElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientY - rect.top - 10) / (rect.height - 20)
    change(Math.round(12 - ratio * 24))
  }

  return (
    <div className={`vkap_equalizer_band ${className}`} style={{ gridColumn: column }}>
      <span className='vkap_equalizer_value' aria-hidden='true'>{signed(value)}</span>
      <div
        className='vkap_equalizer_control'
        role='slider'
        tabIndex={0}
        aria-valuemin={-12}
        aria-valuemax={12}
        aria-valuenow={value}
        aria-label={label}
        aria-orientation='vertical'
        aria-valuetext={decibels(value)}
        onKeyDown={onKeyDown}
        onPointerDown={event => {
          if (event.button !== 0) return
          event.preventDefault()
          event.currentTarget.focus()
          event.currentTarget.setPointerCapture(event.pointerId)
          changeFromPointer(event)
        }}
        onPointerMove={event => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) changeFromPointer(event)
        }}
        onPointerUp={event => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
        }}
      >
        <span className='vkap_equalizer_rail' aria-hidden='true'>
          <span className='vkap_equalizer_fill' style={{ top: `${Math.min(50, 50 - value / 24 * 100)}%`, height: `${Math.abs(value) / 24 * 100}%` }} />
          <span className='vkap_equalizer_thumb' style={{ top: `${50 - value / 24 * 100}%` }} />
        </span>
      </div>
      <span className='vkap_equalizer_frequency' aria-hidden='true'>{short}</span>
    </div>
  )
}

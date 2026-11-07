import { equalizer, type commonTypes } from '@vk-audiopad/common'
import { useCallback, useEffect } from 'react'
import { usePlayed } from '@/entities/active-track'
import { equalizerSettingsAtom, equalizerStatusAtom } from '@/entities/modal'
import { atom, storageAtom, useAtomValue } from '@/shared/lib/atom'

const announcement = storageAtom({ key: 'equalizerAnnouncementPending', initial: false, compareObjects: false })
const source = storageAtom<commonTypes.ApplicationActiveTrackState['activeTrack']>({ key: 'activeTrack', initial: null, compareObjects: false })
const mixHintShown = atom(false)
const mixAllowed = atom<boolean | null>(null)
type Hint = 'access' | 'announcement'
const currentHint = atom<{ kind: Hint, shown: boolean }>({ kind: 'announcement', shown: false })

const hide = (): void => {
  const current = currentHint.get()
  if (current.shown) currentHint.set({ ...current, shown: false })
}

export const useEqualizerHint = () => {
  const pending = useAtomValue(announcement)
  const settings = equalizer.normalize(useAtomValue(equalizerSettingsAtom))
  const status = useAtomValue(equalizerStatusAtom)
  const track = useAtomValue(source)
  const played = usePlayed()
  const allowed = useAtomValue(mixAllowed)
  const mixSeen = useAtomValue(mixHintShown)
  const notice = useAtomValue(currentHint)

  useEffect(() => {
    let active = true
    const check = (): void => {
      void chrome.permissions.contains({ origins: ['https://*.okcdn.ru/*'] }).then(granted => { if (active) mixAllowed.set(granted) }).catch(() => {})
    }
    check()
    chrome.permissions.onAdded?.addListener(check)
    chrome.permissions.onRemoved?.addListener(check)
    return () => {
      active = false
      chrome.permissions.onAdded?.removeListener(check)
      chrome.permissions.onRemoved?.removeListener(check)
    }
  }, [track?.url, settings.enabled])

  const blocked = settings.enabled && played && status === 'unavailable' && equalizer.isMixSource(track?.url) && allowed === false

  useEffect(() => {
    if (!settings.enabled || allowed === true) mixHintShown.set(false)
    if (!blocked && currentHint.get().kind === 'access') hide()
  }, [blocked, settings.enabled, allowed])

  const candidate: Hint | null = notice.shown ? null : blocked && !mixSeen ? 'access' : pending && allowed != null && !blocked ? 'announcement' : null

  useEffect(() => {
    if (candidate == null) return
    const timeout = setTimeout(() => {
      if (currentHint.get().shown || document.querySelector('[role="dialog"], [role="alertdialog"]') != null) return
      if (candidate === 'access' && mixHintShown.get()) return
      if (candidate === 'announcement' && !announcement.get()) return
      currentHint.set({ kind: candidate, shown: true })
      if (candidate === 'access') mixHintShown.set(true)
      else announcement.set(false)
    }, 1500)
    return () => { clearTimeout(timeout) }
  }, [candidate])

  const close = useCallback((): void => {
    hide()
    if (blocked) mixHintShown.set(true)
    if (announcement.get()) announcement.set(false)
  }, [blocked])

  useEffect(() => {
    if (!notice.shown) return
    const timeout = setTimeout(hide, 5000)
    return () => { clearTimeout(timeout) }
  }, [notice.shown, notice.kind])

  return { hint: notice.kind, shown: notice.shown, close }
}

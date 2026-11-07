import { commonTypes } from '@vk-audiopad/common'
import { useEffect } from 'react'
import { sendMessage } from '@/shared/lib/send-message'

const spaceControls = 'input, textarea, select, button, summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="textbox"], [role="slider"], [role="combobox"], [role="listbox"], [role="menuitem"], [role="checkbox"], [role="radio"], [role="switch"]'

export const usePlaybackShortcut = (): void => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const space = event.code === 'Space' || event.key === ' ' || event.key === 'Spacebar'
      if (!space || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing) return
      if (document.querySelector('[role="dialog"], [role="alertdialog"], [aria-modal="true"]') != null) return
      if (event.composedPath().some(target => target instanceof Element && target.matches(spaceControls))) return
      event.preventDefault()
      if (!event.repeat) {
        sendMessage({ target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.TOGGLE_PLAYBACK })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])
}

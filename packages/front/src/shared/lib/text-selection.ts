import { type MouseEvent } from 'react'

export const hasTextSelection = (event: MouseEvent<Element>): boolean => {
  if (event.detail === 0) return false
  const selection = event.currentTarget.ownerDocument.getSelection()
  if (selection == null || selection.isCollapsed) return false
  for (let index = 0; index < selection.rangeCount; index++) {
    if (selection.getRangeAt(index).intersectsNode(event.currentTarget)) return true
  }
  return false
}

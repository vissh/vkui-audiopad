import { type MouseEvent } from 'react'

export const hasTextSelection = (event: MouseEvent<Element>): boolean => {
  if (event.detail === 0) return false
  const selection = event.currentTarget.ownerDocument.getSelection()
  if (selection == null || selection.isCollapsed) return false
  const target = event.target instanceof Node ? event.target : event.currentTarget
  if ((target.textContent ?? '').trim().length === 0) return false
  for (let index = 0; index < selection.rangeCount; index++) {
    const range = selection.getRangeAt(index)
    if (range.intersectsNode(target) && range.toString().trim().length > 0) return true
  }
  return false
}

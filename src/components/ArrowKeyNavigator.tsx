import { useEffect } from 'react'

const focusableSelector = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  '[tabindex]',
  '[role="button"]',
  '[role="link"]',
].join(',')

const isEditableTarget = (target: EventTarget | null) => {
  if (!target || !(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true
  return Boolean(target.isContentEditable)
}

const isElementVisible = (element: HTMLElement) => {
  if (element.closest('[aria-hidden="true"]')) return false
  if (element.hidden) return false
  const rects = element.getClientRects()
  return rects.length > 0
}

const getFocusableElements = () => {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(focusableSelector))
  return nodes.filter((element) => {
    if (!isElementVisible(element)) return false
    if (element.tabIndex < 0) return false
    if (element.getAttribute('aria-disabled') === 'true') return false
    if ('disabled' in element && (element as HTMLButtonElement).disabled) return false
    return true
  })
}

export const ArrowKeyNavigator = () => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      if (event.altKey || event.ctrlKey || event.metaKey) return
      if (isEditableTarget(event.target)) return

      const isForward = event.key === 'ArrowRight' || event.key === 'ArrowDown'
      const isBackward = event.key === 'ArrowLeft' || event.key === 'ArrowUp'
      if (!isForward && !isBackward) return

      const focusable = getFocusableElements()
      if (focusable.length === 0) return

      const active = document.activeElement as HTMLElement | null
      const currentIndex = active ? focusable.indexOf(active) : -1
      let nextIndex = 0

      if (currentIndex === -1) {
        nextIndex = isBackward ? focusable.length - 1 : 0
      } else if (isForward) {
        nextIndex = (currentIndex + 1) % focusable.length
      } else {
        nextIndex = (currentIndex - 1 + focusable.length) % focusable.length
      }

      const next = focusable[nextIndex]
      if (!next || next === active) return
      event.preventDefault()
      next.focus()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return null
}

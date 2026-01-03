import { useCallback, useEffect, useRef, useState } from 'react'

type ContentMagnifierProps = {
  enabled: boolean
}

export const ContentMagnifier = ({ enabled }: ContentMagnifierProps) => {
  const [magnifierText, setMagnifierText] = useState<string | null>(null)
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 })
  const magnifierRef = useRef<HTMLDivElement | null>(null)
  const magnifierFrame = useRef<number | null>(null)
  const magnifierPointRef = useRef({ x: 0, y: 0 })
  const magnifierTextRef = useRef<string | null>(null)

  const scheduleMagnifierPosition = useCallback(() => {
    if (magnifierFrame.current !== null) return
    magnifierFrame.current = window.requestAnimationFrame(() => {
      magnifierFrame.current = null
      const { x, y } = magnifierPointRef.current
      let nextX = x
      let nextY = y + 24
      const margin = 16
      const rect = magnifierRef.current?.getBoundingClientRect()
      if (rect) {
        const halfWidth = rect.width / 2
        const halfHeight = rect.height / 2
        nextX = Math.min(Math.max(nextX, margin + halfWidth), window.innerWidth - margin - halfWidth)
        nextY = Math.min(Math.max(nextY, margin + halfHeight), window.innerHeight - margin - halfHeight)
      }
      setMagnifierPosition({ x: nextX, y: nextY })
    })
  }, [])

  useEffect(() => {
    if (!enabled) {
      setMagnifierText(null)
      magnifierTextRef.current = null
      return
    }

    const getCleanText = (text: string) => text.replace(/\s+/g, ' ').trim()
    const allowedTextTags = new Set([
      'P',
      'SPAN',
      'STRONG',
      'EM',
      'SMALL',
      'LI',
      'A',
      'H1',
      'H2',
      'H3',
      'H4',
      'H5',
      'H6',
      'BUTTON',
    ])
    const isTextTargetAllowed = (element: HTMLElement) => allowedTextTags.has(element.tagName)
    const findAllowedTextContainer = (element: HTMLElement | null) => {
      let current = element
      while (current && current !== document.body) {
        if (current.closest('[data-lupa-ignore="true"]')) return null
        if (current.matches('input, textarea, select, button, [contenteditable="true"], [aria-hidden="true"]')) {
          return null
        }
        if (isTextTargetAllowed(current)) return current
        current = current.parentElement
      }
      return null
    }
    const getTextNodeAtPoint = (x: number, y: number) => {
      const doc = document as Document & {
        caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node } | null
        caretRangeFromPoint?: (x: number, y: number) => Range | null
      }
      if (doc.caretPositionFromPoint) {
        const position = doc.caretPositionFromPoint(x, y)
        return position?.offsetNode ?? null
      }
      if (doc.caretRangeFromPoint) {
        const range = doc.caretRangeFromPoint(x, y)
        return range?.startContainer ?? null
      }
      return null
    }
    const getAriaText = (element: HTMLElement) => {
      const aria = element.getAttribute('aria-label')
      return aria ? getCleanText(aria) : ''
    }
    const resolveFormControlText = (element: HTMLElement) => {
      if (element instanceof HTMLInputElement) {
        const text = element.value || element.placeholder || getAriaText(element)
        return getCleanText(text)
      }
      if (element instanceof HTMLSelectElement) {
        const option = element.selectedOptions[0]?.textContent ?? element.value
        const text = option || getAriaText(element)
        return getCleanText(text)
      }
      return ''
    }
    const resolveHoverText = (event: MouseEvent) => {
      const target = document.elementFromPoint(event.clientX, event.clientY)
      if (!(target instanceof HTMLElement)) return null
      if (target.closest('[data-lupa-ignore="true"]')) return null
      if (target.matches('textarea, [contenteditable="true"], [aria-hidden="true"]')) {
        return null
      }

      const labelElement = target.closest('label')
      if (labelElement) {
        const htmlFor = labelElement.getAttribute('for')
        const labeledControl = htmlFor ? document.getElementById(htmlFor) : labelElement.querySelector('input, select')
        if (labeledControl instanceof HTMLElement) {
          const text = resolveFormControlText(labeledControl)
          return text || null
        }
      }

      if (target.matches('input, select')) {
        const text = resolveFormControlText(target)
        return text || null
      }

      if (target.matches('button')) {
        const text = getCleanText(target.textContent ?? '') || getAriaText(target)
        return text || null
      }

      const textNode = getTextNodeAtPoint(event.clientX, event.clientY)
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        const textParent = textNode.parentElement
        const allowedParent = findAllowedTextContainer(textParent)
        if (allowedParent) {
          const raw = allowedParent.textContent ?? ''
          return getCleanText(raw)
        }
        const raw = textNode.textContent ?? ''
        return getCleanText(raw)
      }

      const fallback = findAllowedTextContainer(target)
      if (!fallback) return null
      const raw = fallback.textContent ?? ''
      return getCleanText(raw)
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (window.getSelection()?.toString().trim()) return
      const cleanedText = resolveHoverText(event)
      if (!cleanedText) {
        if (magnifierTextRef.current !== null) {
          magnifierTextRef.current = null
          setMagnifierText(null)
        }
        return
      }
      const truncatedText = cleanedText.length > 260 ? `${cleanedText.slice(0, 257)}...` : cleanedText

      if (magnifierTextRef.current !== truncatedText) {
        magnifierTextRef.current = truncatedText
        setMagnifierText(truncatedText)
      }

      magnifierPointRef.current = { x: event.clientX, y: event.clientY }
      scheduleMagnifierPosition()
    }

    const handleMouseLeave = () => {
      magnifierTextRef.current = null
      setMagnifierText(null)
    }

    const handleScroll = () => {
      magnifierTextRef.current = null
      setMagnifierText(null)
    }

    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      if (magnifierFrame.current !== null) {
        window.cancelAnimationFrame(magnifierFrame.current)
        magnifierFrame.current = null
      }
    }
  }, [enabled, scheduleMagnifierPosition])

  if (!enabled || !magnifierText) return null

  return (
    <div
      className="content-magnifier"
      ref={magnifierRef}
      style={{ left: `${magnifierPosition.x}px`, top: `${magnifierPosition.y}px` }}
      aria-hidden="true"
      data-lupa-ignore="true"
    >
      {magnifierText}
    </div>
  )
}

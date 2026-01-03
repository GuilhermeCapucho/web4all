import { useEffect } from 'react'

type ScreenReaderProps = {
  enabled: boolean
}

const getTextFromLabels = (element: HTMLElement) => {
  const labelledBy = element.getAttribute('aria-labelledby')
  if (!labelledBy) return ''
  const labels = labelledBy
    .split(/\s+/)
    .map((id) => document.getElementById(id)?.innerText?.trim())
    .filter(Boolean)
  return labels.join(' ').trim()
}

const getReadableText = (element: HTMLElement) => {
  const ariaLabel = element.getAttribute('aria-label')?.trim()
  if (ariaLabel) return ariaLabel

  const labelledText = getTextFromLabels(element)
  if (labelledText) return labelledText

  if (element instanceof HTMLImageElement) {
    const alt = element.alt?.trim()
    if (alt) return alt
  }

  if (element instanceof HTMLOptionElement) {
    return element.text?.trim() ?? ''
  }

  if (element instanceof HTMLSelectElement) {
    const label = element.labels?.[0]?.innerText?.trim()
    const selectedText = element.selectedOptions?.[0]?.text?.trim()
    return [label, selectedText].filter(Boolean).join(' ').trim()
  }

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const label = element.labels?.[0]?.innerText?.trim()
    const value = element.value?.trim()
    const placeholder = element.getAttribute('placeholder')?.trim()
    return [label, value || placeholder].filter(Boolean).join(' ').trim()
  }

  const target = element.closest('button, a, label, p, span, li, h1, h2, h3, h4, h5, h6, [role="button"], [role="link"]') as HTMLElement | null
  const candidate = target ?? element
  const text = candidate.innerText?.trim() || candidate.textContent?.trim()
  return text ?? ''
}

export const ScreenReader = ({ enabled }: ScreenReaderProps) => {
  useEffect(() => {
    if (!enabled) return
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      return
    }

    const handleClick = (event: MouseEvent) => {
      const node = event.target as Node | null
      if (!node) return
      const target = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement)
      if (!target) return
      const text = getReadableText(target)
      if (!text) return
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'pt-BR'
      window.speechSynthesis.speak(utterance)
    }

    document.addEventListener('click', handleClick, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
      window.speechSynthesis.cancel()
    }
  }, [enabled])

  return null
}

import { useEffect, useState } from 'react'

type TransientStatusOptions = {
  hideAfterMs?: number
  clearAfterMs?: number
}

export const useTransientStatus = (options: TransientStatusOptions = {}) => {
  const { hideAfterMs = 5000, clearAfterMs = 5300 } = options
  const [status, setStatus] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!status) {
      return
    }
    setVisible(true)
    const hideTimer = window.setTimeout(() => {
      setVisible(false)
    }, hideAfterMs)
    const clearTimer = window.setTimeout(() => {
      setStatus(null)
    }, clearAfterMs)
    return () => {
      window.clearTimeout(hideTimer)
      window.clearTimeout(clearTimer)
    }
  }, [clearAfterMs, hideAfterMs, status])

  return {
    status,
    setStatus,
    visible,
  }
}

'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'band-sound-enabled'
const SILENT_ROUTES = ['/writing', '/speaking']

export function isSilentRoute(pathname: string): boolean {
  return SILENT_ROUTES.some((r) => pathname.startsWith(r))
}

export function useSoundPreference() {
  const [soundEnabled, setSoundEnabled] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) setSoundEnabled(stored === 'true')
  }, [])

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }, [])

  return { soundEnabled, toggleSound }
}

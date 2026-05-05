'use client'

import { usePathname } from 'next/navigation'
import { isSilentRoute, useSoundPreference } from '@/hooks/use-sound-preference'

export function SoundToggle() {
  const pathname = usePathname()
  const { soundEnabled, toggleSound } = useSoundPreference()

  if (isSilentRoute(pathname)) return null

  return (
    <button
      onClick={toggleSound}
      title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
      style={{
        background: 'none',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: '0.3rem 0.6rem',
        cursor: 'pointer',
        fontSize: '1rem',
        color: '#6b7280',
      }}
    >
      {soundEnabled ? '🔔' : '🔕'}
    </button>
  )
}

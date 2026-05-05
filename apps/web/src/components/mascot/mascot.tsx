'use client'

type Mood = 'happy' | 'encouraging' | 'celebrating' | 'worried' | 'neutral' | 'focused' | 'thinking' | 'proud'

const MOOD_EMOJI: Record<Mood, string> = {
  happy: '🦉',
  encouraging: '🦉',
  celebrating: '🎉🦉',
  worried: '😟🦉',
  neutral: '🦉',
  focused: '🦉',
  thinking: '🤔🦉',
  proud: '🦉⭐',
}

const MOOD_DEFAULT_MESSAGE: Record<Mood, string> = {
  happy: "Hi! I'm Bandy, your IELTS coach.",
  encouraging: "You've got this! Start your first practice session.",
  celebrating: 'Quest complete! Well done!',
  worried: "Don't give up — every practice counts.",
  neutral: '',
  focused: 'Stay focused. You can do it.',
  thinking: 'Analysing your results...',
  proud: "You're on a streak! Keep going!",
}

const SIZE_PX: Record<'sm' | 'md' | 'lg', string> = {
  sm: '2rem',
  md: '3rem',
  lg: '4rem',
}

interface Props {
  mood: Mood
  size?: 'sm' | 'md' | 'lg'
  message?: string | null
  showMessage?: boolean
}

export function Mascot({ mood, size = 'md', message, showMessage = true }: Props) {
  const displayMessage = message !== undefined ? message : MOOD_DEFAULT_MESSAGE[mood]

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: SIZE_PX[size], lineHeight: 1 }}>{MOOD_EMOJI[mood]}</div>
      {showMessage && displayMessage && (
        <p style={{ margin: '0.5rem 0 0', color: '#555', fontSize: '0.9rem' }}>{displayMessage}</p>
      )}
    </div>
  )
}

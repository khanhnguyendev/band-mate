import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Band Mate — IELTS Practice',
  description: 'AI-assisted IELTS preparation',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

import { Inter, Prata } from 'next/font/google'

// The design fonts lack Cyrillic
export const prata = Prata({
  weight: '400',
  subsets: ['latin', 'cyrillic'],
  variable: '--font-prata',
  display: 'swap',
})

export const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

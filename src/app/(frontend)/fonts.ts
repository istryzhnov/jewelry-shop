import { Inter, Prata } from 'next/font/google'

// Prata stands in for the designs' display serifs (Moneta / Italiana), which lack Cyrillic
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

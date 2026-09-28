const uah = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 })

export const formatPrice = (value: number | null | undefined) =>
  typeof value === 'number' ? `${uah.format(value)} ₴` : ''

export const instagramProfileUrl = (username?: string | null) =>
  username ? `https://www.instagram.com/${username}/` : null

// Opens a Direct chat with the shop in the app or browser
export const instagramDirectUrl = (username?: string | null) =>
  username ? `https://ig.me/m/${username}` : null

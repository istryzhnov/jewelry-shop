// Ukrainian national transliteration (KMU resolution No. 55, 2010)
// prettier-ignore
const letters: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z',
  и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p',
  р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'shch', ь: '', ю: 'iu', я: 'ia',
  ё: 'io', ы: 'y', э: 'e', ъ: '',
}

const wordStart: Record<string, string> = { є: 'ye', ї: 'yi', й: 'y', ю: 'yu', я: 'ya' }

export function transliterate(input: string): string {
  const text = input.toLowerCase().replace(/зг/g, 'zgh')
  let result = ''
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const atWordStart = i === 0 || !/[\p{L}'’ʼ]/u.test(text[i - 1])
    if (atWordStart && wordStart[char]) result += wordStart[char]
    else result += letters[char] ?? char
  }
  return result
}

export function slugify(input: string | undefined | null): string | undefined {
  if (!input) return undefined
  return transliterate(input)
    .replace(/['’ʼ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

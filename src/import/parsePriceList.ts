import type { CellValue, Workbook, Worksheet } from 'exceljs'

import { slugify } from '@/utilities/slugify'

export type ProductType = 'ring' | 'earrings' | 'pendant' | 'bracelet' | 'necklace' | 'other'

export type PriceListRow = {
  sku: string
  name: string
  slug: string
  type: ProductType
  category: string
  collection?: string
  costPrice: number
  size?: string
  photoFolder?: string
  cell: string
}

export type PriceListIssue = { cell: string; message: string }

export type ParsedPriceList = {
  rows: PriceListRow[]
  issues: PriceListIssue[]
  skippedEmpty: number
}

const TYPE_NAMES: Record<ProductType, string> = {
  ring: 'Каблучка',
  earrings: 'Сережки',
  pendant: 'Підвіска',
  bracelet: 'Браслет',
  necklace: 'Кольє',
  other: 'Прикраса',
}

const OTHER_CATEGORY = 'Кольє, браслети, жетони, шпильки'

const TYPE_CATEGORIES: Record<ProductType, string> = {
  ring: 'Каблучки',
  earrings: 'Сережки',
  pendant: 'Підвіски',
  bracelet: OTHER_CATEGORY,
  necklace: OTHER_CATEGORY,
  other: OTHER_CATEGORY,
}

// Column headers in multi-type blocks (e.g. "940"): one price per product type
const TYPE_COLUMNS: { pattern: RegExp; type: ProductType; skuSuffix: string }[] = [
  { pattern: /^к-?ка/, type: 'ring', skuSuffix: 'R' },
  { pattern: /^с-?ки/, type: 'earrings', skuSuffix: 'E' },
  { pattern: /^підвіс/, type: 'pendant', skuSuffix: 'P' },
  { pattern: /^б-?т/, type: 'bracelet', skuSuffix: 'B' },
  { pattern: /^кольє/, type: 'necklace', skuSuffix: 'N' },
]

const normalize = (s: string) =>
  s
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/,(?=\S)/g, ', ')
    .trim()

function typeOfCategory(category: string): ProductType {
  const c = category.toLowerCase()
  if (c.startsWith('каблуч')) return 'ring'
  if (c.startsWith('сереж')) return 'earrings'
  if (c.startsWith('підвіс')) return 'pendant'
  return 'other'
}

function cellText(value: CellValue): string {
  if (value == null) return ''
  if (typeof value === 'object') {
    if ('richText' in value) return value.richText.map((r) => r.text).join('')
    if ('text' in value) return String(value.text)
    if ('result' in value) return value.result == null ? '' : String(value.result)
    if (value instanceof Date) return value.toISOString()
    return ''
  }
  return String(value)
}

function cellLink(value: CellValue): string | undefined {
  if (value && typeof value === 'object' && 'hyperlink' in value) return value.hyperlink
  const text = cellText(value)
  return /^https?:\/\//.test(text) ? text : undefined
}

type ParsedPrice = { price: number; size?: string } | { error: string } | null

// Accepts 1210, "1835", "8 зв 5540" (size + price); rejects per-gram prices like "270/1 г"
export function parsePrice(value: CellValue): ParsedPrice {
  if (typeof value === 'number') return value > 0 ? { price: value } : null
  const text = cellText(value).trim()
  if (!text) return null
  if (/\/\s*\d*\s*г(?!\p{L})/u.test(text)) return { error: `ціна за грам («${text}»)` }
  const match = text.match(/^(.*?)\s*(\d+(?:[.,]\d+)?)\s*(?:грн)?$/)
  if (!match) return { error: `не вдалося розпізнати ціну «${text}»` }
  const price = Number(match[2].replace(',', '.'))
  const size = match[1].trim()
  return size ? { price, size } : { price }
}

type Block = { col: number; header: string; columns: { col: number; label: string }[] }

function findBlocks(ws: Worksheet, headerRow: number): Block[] {
  const row = ws.getRow(headerRow)
  const starts: number[] = []
  for (let col = 1; col <= ws.columnCount; col++) {
    if (cellText(row.getCell(col).value).trim().toLowerCase() === 'арт') starts.push(col)
  }
  return starts.map((col) => {
    const columns: Block['columns'] = []
    for (let c = col + 1; c <= ws.columnCount; c++) {
      const label = cellText(row.getCell(c).value).trim().toLowerCase()
      if (!label || label === 'арт') break
      columns.push({ col: c, label })
    }
    const header = headerRow > 1 ? cellText(ws.getRow(headerRow - 1).getCell(col).value) : ''
    return { col, header: normalize(header), columns }
  })
}

const ARTICLE = /^\d[\p{L}\d-]*$/u

// "012/012-1" → two articles sharing a price; "722 ж/б" → "722-жб"
export function splitArticles(raw: string): string[] | null {
  const parts = raw.split('/').map((p) => p.trim())
  const shared = parts.length > 1 && parts.every((p) => /^\d{3}/.test(p))
  const articles = shared
    ? parts
    : [raw.replace(/(\p{L})\s*\/\s*(\p{L})/gu, '$1$2').replace(/\s+/g, '-')]
  return articles.every((a) => ARTICLE.test(a)) ? articles : null
}

export function parsePriceList(workbook: Workbook): ParsedPriceList {
  const rows: PriceListRow[] = []
  const issues: PriceListIssue[] = []
  let skippedEmpty = 0
  const seen = new Map<string, string>()

  for (const ws of workbook.worksheets) {
    const headerRow = [1, 2, 3].find((r) =>
      Array.from({ length: ws.columnCount }, (_, i) =>
        cellText(ws.getRow(r).getCell(i + 1).value),
      ).some((t) => t.trim().toLowerCase() === 'арт'),
    )
    if (!headerRow) continue

    for (const block of findBlocks(ws, headerRow)) {
      const priceCol = block.columns.find((c) => c.label.startsWith('ціна'))
      const photoCol = block.columns.find((c) => c.label.startsWith('фото'))
      const typeCols = block.columns.flatMap((c) => {
        const match = TYPE_COLUMNS.find((t) => t.pattern.test(c.label))
        return match ? [{ ...match, col: c.col }] : []
      })

      for (let r = headerRow + 1; r <= ws.rowCount; r++) {
        const row = ws.getRow(r)
        const articleCell = row.getCell(block.col)
        const raw = cellText(articleCell.value).trim()
        if (!raw) continue
        if (articleCell.value instanceof Date) {
          issues.push({
            cell: articleCell.address,
            message: 'артикул відформатований як дата — змініть формат клітинки на текст',
          })
          continue
        }
        const articles = splitArticles(raw)
        if (!articles) {
          issues.push({
            cell: articleCell.address,
            message: `пропущено рядок «${raw}» — не схоже на артикул`,
          })
          continue
        }
        const photoFolder = photoCol ? cellLink(row.getCell(photoCol.col).value) : undefined

        const candidates = articles.flatMap((article) =>
          typeCols.length
            ? typeCols.map((t) => ({
                article,
                sku: `${article}-${t.skuSuffix}`,
                type: t.type,
                category: TYPE_CATEGORIES[t.type],
                collection: block.header || undefined,
                priceCell: row.getCell(t.col),
              }))
            : priceCol
              ? [
                  {
                    article,
                    sku: article,
                    type: typeOfCategory(block.header),
                    category: block.header,
                    collection: undefined,
                    priceCell: row.getCell(priceCol.col),
                  },
                ]
              : [],
        )

        for (const { sku, article, type, category, collection, priceCell } of candidates) {
          const parsed = parsePrice(priceCell.value)
          if (!parsed) {
            if (!typeCols.length) skippedEmpty++
            continue
          }
          if ('error' in parsed) {
            issues.push({ cell: priceCell.address, message: `${sku}: ${parsed.error}, пропущено` })
            continue
          }
          if (seen.has(sku)) {
            issues.push({
              cell: articleCell.address,
              message: `артикул ${sku} повторюється (вже є в ${seen.get(sku)}), пропущено`,
            })
            continue
          }
          seen.set(sku, articleCell.address)
          rows.push({
            sku,
            name: `${TYPE_NAMES[type]} ${article}`,
            slug: slugify(`${TYPE_NAMES[type]} ${sku}`)!,
            type,
            category,
            collection,
            costPrice: parsed.price,
            size: parsed.size,
            photoFolder,
            cell: articleCell.address,
          })
        }
      }
    }
  }

  return { rows, issues, skippedEmpty }
}

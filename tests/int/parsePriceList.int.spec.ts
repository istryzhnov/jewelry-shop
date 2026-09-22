import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'

import { parsePrice, parsePriceList, splitArticles } from '@/import/parsePriceList'

const FOLDER = 'https://drive.google.com/drive/folders/abc123'

// Mirrors the supplier layout: a multi-type block, then per-category blocks side by side
function buildWorkbook() {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Лист1')
  ws.getRow(1).values = [
    '940',
    null,
    null,
    null,
    null,
    null,
    null,
    'Каблучки',
    null,
    null,
    'Кольє, браслети , жетони ',
  ]
  ws.mergeCells('A1:F1')
  ws.mergeCells('H1:J1')
  ws.getRow(2).values = [
    'Арт',
    'к-ка',
    'с-ки',
    'б-т',
    'Фото посилання',
    null,
    null,
    'Арт',
    'Ціна',
    'Фото посилання',
    'Арт',
    'Ціна',
  ]
  const rows: unknown[][] = [
    [
      '001',
      1210,
      1130,
      null,
      null,
      null,
      null,
      '701',
      1800,
      { text: FOLDER, hyperlink: FOLDER },
      '401',
      570,
    ],
    ['004', 1790, null, '8 зв 5540', null, null, null, '722 ж/б', 1500, null, '777', '270/1 г'],
    ['012/012-1', 900, null, null, null, null, null, '701', 999, null, 'Шпилька', 300],
    [null, null, null, null, null, null, null, '8035', null, null, '468/2', 100],
  ]
  rows.forEach((values, i) => (ws.getRow(i + 3).values = values as ExcelJS.CellValue[]))
  return wb
}

describe('parsePrice', () => {
  it('parses numbers, numeric strings and size-prefixed prices', () => {
    expect(parsePrice(1210)).toEqual({ price: 1210 })
    expect(parsePrice('1835')).toEqual({ price: 1835 })
    expect(parsePrice('8 зв 5540')).toEqual({ price: 5540, size: '8 зв' })
  })

  it('rejects per-gram prices and ignores empty cells', () => {
    expect(parsePrice('270/1 г')).toHaveProperty('error')
    expect(parsePrice(null)).toBeNull()
    expect(parsePrice(0)).toBeNull()
  })
})

describe('splitArticles', () => {
  it('handles shared and composite articles', () => {
    expect(splitArticles('012/012-1')).toEqual(['012', '012-1'])
    expect(splitArticles('722 ж/б')).toEqual(['722-жб'])
    expect(splitArticles('901-2жб')).toEqual(['901-2жб'])
    expect(splitArticles('468/2')).toBeNull()
    expect(splitArticles('Шпилька')).toBeNull()
  })
})

describe('parsePriceList', () => {
  const { rows, issues, skippedEmpty } = parsePriceList(buildWorkbook())
  const bySku = Object.fromEntries(rows.map((r) => [r.sku, r]))

  it('splits multi-type block into one product per type within a collection', () => {
    expect(bySku['001-R']).toMatchObject({
      name: 'Каблучка 001',
      category: 'Каблучки',
      collection: '940',
      costPrice: 1210,
    })
    expect(bySku['001-E']).toMatchObject({ type: 'earrings', category: 'Сережки', costPrice: 1130 })
    expect(bySku['004-B']).toMatchObject({ type: 'bracelet', costPrice: 5540, size: '8 зв' })
    expect(bySku['004-E']).toBeUndefined()
  })

  it('reads category blocks with prices and photo folders', () => {
    expect(bySku['701']).toMatchObject({
      name: 'Каблучка 701',
      type: 'ring',
      category: 'Каблучки',
      costPrice: 1800,
      photoFolder: FOLDER,
    })
    expect(bySku['722-жб']).toMatchObject({ costPrice: 1500 })
    expect(bySku['401']).toMatchObject({ type: 'other', category: 'Кольє, браслети, жетони' })
  })

  it('creates both products for a shared article cell', () => {
    expect(bySku['012-R']).toMatchObject({ costPrice: 900 })
    expect(bySku['012-1-R']).toMatchObject({ costPrice: 900 })
  })

  it('reports duplicates, per-gram prices and non-article rows', () => {
    const messages = issues.map((i) => i.message).join('\n')
    expect(messages).toMatch(/701 повторюється/)
    expect(messages).toMatch(/777: ціна за грам/)
    expect(messages).toMatch(/«Шпилька»/)
    expect(messages).toMatch(/«468\/2»/)
    expect(bySku['701'].costPrice).toBe(1800)
  })

  it('counts articles without a price', () => {
    expect(skippedEmpty).toBe(1)
  })
})

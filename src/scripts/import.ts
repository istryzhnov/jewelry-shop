import ExcelJS from 'exceljs'
import { getPayload } from 'payload'

import config from '@payload-config'
import { archiveMissing, planImport, TaxonomyCache, upsertRow } from '@/import/applyImport'
import { parsePriceList } from '@/import/parsePriceList'
import { syncAndRecordPhotos } from '@/import/syncPhotos'

// npm run import -- <file.xlsx> [apply] [no-photos] [photo-limit=N]
// `payload run` forwards only positional args, so options have no dashes
const args = process.argv.slice(2)
const file = args.find((a) => a.endsWith('.xlsx'))
const shouldApply = args.includes('apply')
const withPhotos = !args.includes('no-photos')
const photoLimit = Number(args.find((a) => a.startsWith('photo-limit='))?.split('=')[1] ?? Infinity)

if (!file) {
  console.error('Вкажіть шлях до .xlsx файлу')
  process.exit(1)
}

const payload = await getPayload({ config })
const log = (msg: string) => payload.logger.info(msg)

const workbook = new ExcelJS.Workbook()
await workbook.xlsx.readFile(file)
const { rows, issues, skippedEmpty } = parsePriceList(workbook)
const plan = await planImport(payload, rows)

log(`Позицій: ${rows.length}, без ціни: ${skippedEmpty}, пропущених рядків: ${issues.length}`)
for (const issue of issues) log(`  ${issue.cell}: ${issue.message}`)
log(
  `Нових: ${plan.create.length}, оновиться: ${plan.update.length}, без змін: ${plan.unchanged}, ` +
    `знімуться: ${plan.archive.length}, конфліктів: ${plan.conflicts.length}`,
)

if (!shouldApply) {
  log('Це лише звіт. Додайте apply, щоб внести зміни.')
  process.exit(0)
}

const taxonomy = await new TaxonomyCache(payload).load()
const needPhotos: number[] = []
const counts = { created: 0, updated: 0, unchanged: 0, conflict: 0, errors: 0 }
for (const [i, row] of rows.entries()) {
  try {
    const { result, productId, needsPhotos } = await upsertRow(payload, row, taxonomy)
    counts[result]++
    if (needsPhotos && productId) needPhotos.push(productId)
  } catch (err) {
    counts.errors++
    payload.logger.error(`${row.sku}: ${err instanceof Error ? err.message : err}`)
  }
  if ((i + 1) % 100 === 0) log(`  оброблено ${i + 1}/${rows.length}`)
}
const archived = await archiveMissing(payload, new Set(rows.map((r) => r.sku)))
log(`Готово: ${JSON.stringify({ ...counts, archived })}`)

if (withPhotos) {
  const queue = needPhotos.slice(0, photoLimit)
  log(`Фото для ${queue.length} товарів…`)
  for (const [i, productId] of queue.entries()) {
    try {
      const { added, failed } = await syncAndRecordPhotos(payload, productId)
      log(
        `  ${i + 1}/${queue.length}: товар ${productId}, нових фото ${added}, недоступних ${failed.length}`,
      )
    } catch (err) {
      payload.logger.error(`  товар ${productId}: ${err instanceof Error ? err.message : err}`)
    }
  }
}
process.exit(0)

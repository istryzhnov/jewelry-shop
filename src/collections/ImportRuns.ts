import ExcelJS from 'exceljs'
import type { CollectionBeforeChangeHook, CollectionConfig, Endpoint } from 'payload'

import { isAdmin } from '@/access'
import { planImport } from '@/import/applyImport'
import { parsePriceList } from '@/import/parsePriceList'
import { emptyResults, QUEUES } from '@/jobs'

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

// Dry run on upload; the catalog changes only after "apply"
const buildPreview: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || !req.file?.data) return data
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(req.file.data as unknown as ArrayBuffer)
  const { rows, issues, skippedEmpty } = parsePriceList(workbook)
  const plan = await planImport(req.payload, rows)
  return {
    ...data,
    status: 'preview',
    rows,
    report: { ...plan, issues, skippedEmpty, total: rows.length },
    results: emptyResults(),
    processed: 0,
  }
}

const INLINE_BUDGET_MS = 7000

const apply: Endpoint = {
  path: '/:id/apply',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return Response.json({ message: 'Unauthorized' }, { status: 401 })
    const id = Number(req.routeParams?.id)
    const run = await req.payload.findByID({ collection: 'import-runs', id, depth: 0 })
    if (run.status !== 'preview') {
      return Response.json({ message: 'Цей імпорт уже застосовано' }, { status: 409 })
    }
    await req.payload.update({ collection: 'import-runs', id, data: { status: 'running' } })
    await req.payload.jobs.queue({
      task: 'importRows',
      input: { runId: id, offset: 0 },
      queue: QUEUES.import,
    })

    const deadline = Date.now() + INLINE_BUDGET_MS
    while (Date.now() < deadline) {
      const { noJobsRemaining } = await req.payload.jobs.run({
        queue: QUEUES.import,
        limit: 1,
        sequential: true,
      })
      if (noJobsRemaining) break
    }
    return Response.json({ ok: true })
  },
}

export const ImportRuns: CollectionConfig = {
  slug: 'import-runs',
  labels: { singular: 'Імпорт прайсу', plural: 'Імпорт прайсу' },
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'status', 'createdAt'],
    group: 'Каталог',
    description:
      'Завантажте .xlsx прайс — спершу побачите звіт, а зміни внесуться після «Застосувати».',
  },
  access: { read: isAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  upload: { mimeTypes: [XLSX] },
  hooks: { beforeChange: [buildPreview] },
  endpoints: [apply],
  fields: [
    {
      name: 'reportView',
      type: 'ui',
      admin: { components: { Field: '@/components/admin/ImportReport' } },
    },
    {
      name: 'status',
      label: 'Статус',
      type: 'select',
      defaultValue: 'preview',
      options: [
        { label: 'Звіт (ще не застосовано)', value: 'preview' },
        { label: 'Виконується', value: 'running' },
        { label: 'Готово', value: 'done' },
      ],
      admin: { readOnly: true, condition: () => false },
    },
    { name: 'processed', type: 'number', defaultValue: 0, admin: { hidden: true } },
    { name: 'report', type: 'json', admin: { hidden: true } },
    { name: 'results', type: 'json', admin: { hidden: true } },
    { name: 'rows', type: 'json', admin: { disabled: true } },
  ],
}

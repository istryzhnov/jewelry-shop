'use client'

import { Button, useDocumentInfo } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

import type { ImportPlan } from '@/import/applyImport'
import type { PriceListIssue } from '@/import/parsePriceList'
import type { ImportResults } from '@/jobs'

type Report = ImportPlan & { issues: PriceListIssue[]; skippedEmpty: number; total: number }
type Run = {
  status: 'preview' | 'running' | 'done'
  processed: number
  report: Report
  results: ImportResults
}

const LIST_LIMIT = 100

async function fetchRun(id: number | string): Promise<Run | null> {
  const fields = ['status', 'processed', 'report', 'results']
    .map((f) => `select[${f}]=true`)
    .join('&')
  const res = await fetch(`/api/import-runs/${id}?depth=0&${fields}`, { credentials: 'include' })
  return res.ok ? res.json() : null
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return (
    <details style={{ marginTop: 12 }}>
      <summary style={{ cursor: 'pointer' }}>
        {title}: {items.length}
      </summary>
      <ul style={{ margin: '8px 0 0', paddingLeft: 20, maxHeight: 320, overflow: 'auto' }}>
        {items.slice(0, LIST_LIMIT).map((item, i) => (
          <li key={i}>{item}</li>
        ))}
        {items.length > LIST_LIMIT && <li>… ще {items.length - LIST_LIMIT}</li>}
      </ul>
    </details>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: '8px 12px', background: 'var(--theme-elevation-50)', borderRadius: 4 }}>
      <div style={{ fontSize: 22, fontWeight: 600 }}>{value}</div>
      <div style={{ opacity: 0.7 }}>{label}</div>
    </div>
  )
}

export default function ImportReport() {
  const { id } = useDocumentInfo()
  const [run, setRun] = useState<Run | null>(null)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [version, setVersion] = useState(0)
  const reload = () => setVersion((v) => v + 1)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    fetchRun(id).then((r) => !cancelled && setRun(r))
    return () => {
      cancelled = true
    }
  }, [id, version])

  useEffect(() => {
    if (run?.status !== 'running') return
    const timer = setInterval(reload, 3000)
    return () => clearInterval(timer)
  }, [run?.status])

  const apply = async () => {
    setApplying(true)
    setError(null)
    const res = await fetch(`/api/import-runs/${id}/apply`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) setError((await res.json()).message ?? 'Помилка')
    setApplying(false)
    reload()
  }

  if (!id) return <p>Завантажте .xlsx файл прайсу і збережіть — з’явиться звіт.</p>
  if (!run?.report) return <p>Завантаження звіту…</p>

  const { report, results } = run
  const grid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 8,
  }

  return (
    <div style={{ marginBottom: 32 }}>
      {run.status === 'preview' && (
        <>
          <h3>Що зміниться</h3>
          <div style={grid}>
            <Stat label="Позицій у файлі" value={report.total} />
            <Stat label="Нових товарів" value={report.create.length} />
            <Stat label="Оновиться" value={report.update.length} />
            <Stat label="Без змін" value={report.unchanged} />
            <Stat label="Знімуться з сайту" value={report.archive.length} />
          </div>
          <Section
            title="Пропущені рядки у файлі"
            items={report.issues.map((i) => `${i.cell}: ${i.message}`)}
          />
          <Section
            title="Оновлення"
            items={report.update.map((u) => `${u.sku}: ${u.changes.join(', ')}`)}
          />
          <Section title="Нові артикули" items={report.create} />
          <Section title="Зникли з прайсу (буде знято з сайту)" items={report.archive} />
          <Section
            title="Артикули вже зайняті товарами, створеними вручну (пропускаються)"
            items={report.conflicts}
          />
          {report.skippedEmpty > 0 && (
            <p style={{ marginTop: 12, opacity: 0.7 }}>
              Артикулів без ціни (пропущено): {report.skippedEmpty}
            </p>
          )}
          <div style={{ marginTop: 16 }}>
            <Button onClick={apply} disabled={applying}>
              {applying ? 'Застосовується…' : 'Застосувати'}
            </Button>
            {error && <p style={{ color: 'var(--theme-error-500)' }}>{error}</p>}
          </div>
        </>
      )}

      {run.status !== 'preview' && (
        <>
          <h3>
            {run.status === 'running'
              ? `Виконується: ${run.processed} з ${report.total}`
              : 'Імпорт завершено'}
          </h3>
          <div style={grid}>
            <Stat label="Створено" value={results.created} />
            <Stat label="Оновлено" value={results.updated} />
            <Stat label="Без змін" value={results.unchanged} />
            <Stat label="Знято з сайту" value={results.archived} />
            <Stat label="Фото в черзі" value={results.photosQueued} />
          </div>
          <Section title="Помилки" items={results.errors.map((e) => `${e.sku}: ${e.message}`)} />
          {results.photosQueued > 0 && (
            <p style={{ marginTop: 12, opacity: 0.7 }}>
              Фото завантажуються у фоні. Товари з фото опублікуються автоматично, щойно фото будуть
              готові.
            </p>
          )}
        </>
      )}
    </div>
  )
}

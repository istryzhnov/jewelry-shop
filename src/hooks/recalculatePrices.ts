import { sql } from '@payloadcms/db-postgres'
import type { PostgresAdapter } from '@payloadcms/db-postgres'
import type { GlobalAfterChangeHook } from 'payload'

// Same formula as utilities/pricing.ts, done in SQL so ~1000 products update in one request
export const recalculatePrices: GlobalAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (doc.markupPercent === previousDoc?.markupPercent && doc.roundTo === previousDoc?.roundTo) {
    return doc
  }
  const markup = Number(doc.markupPercent ?? 0)
  const step = Number(doc.roundTo) > 1 ? Number(doc.roundTo) : 1
  const db = (req.payload.db as unknown as PostgresAdapter).drizzle
  await db.execute(sql`
    UPDATE products_variants
    SET price = CEIL(ROUND(cost_price * (1 + ${markup}::numeric / 100), 2) / ${step}) * ${step}
    WHERE cost_price IS NOT NULL`)
  await db.execute(sql`
    UPDATE products p
    SET min_price = (SELECT MIN(v.price) FROM products_variants v WHERE v._parent_id = p.id)`)
  return doc
}

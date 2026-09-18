'use client'

import { useRowLabel } from '@payloadcms/ui'

type Variant = { sku?: string; size?: string; price?: number }

export default function VariantRowLabel() {
  const { data, rowNumber } = useRowLabel<Variant>()
  const parts = [
    data?.sku,
    data?.size && `р. ${data.size}`,
    data?.price != null && `${data.price} грн`,
  ]
  const label = parts.filter(Boolean).join(' · ')
  return <span>{label || `Варіант ${(rowNumber ?? 0) + 1}`}</span>
}

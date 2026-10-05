'use client'

import { useState } from 'react'

import { track } from '@/lib/analytics'
import { variantLabel } from '@/lib/labels'
import type { Product } from '@/payload-types'
import { formatPrice } from '@/utilities/format'

import { FavoriteButton } from '../FavoriteButton'
import { InstagramIcon } from '../icons'

type Variant = Pick<
  Product['variants'][number],
  'sku' | 'size' | 'metal' | 'purity' | 'price' | 'oldPrice' | 'quantity' | 'madeToOrder'
>

type Props = {
  category?: string
  name: string
  slug: string
  url: string
  variants: Variant[]
  instagramDirect: string | null
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function Purchase({ category, name, slug, url, variants, instagramDirect }: Props) {
  const [index, setIndex] = useState(() =>
    Math.max(
      0,
      variants.findIndex((v) => (v.quantity ?? 0) > 0),
    ),
  )
  const [notice, setNotice] = useState<string | null>(null)
  const variant = variants[index]
  const distinct = (['size', 'metal', 'purity'] as const).filter(
    (key) => new Set(variants.map((v) => v[key] ?? '')).size > 1,
  )
  const chipLabel = (v: Variant) =>
    variantLabel({
      size: distinct.includes('size') ? v.size : null,
      metal: distinct.includes('metal') ? v.metal : null,
      purity: distinct.includes('purity') ? v.purity : null,
    }) || v.sku
  const available = (variant.quantity ?? 0) > 0 || Boolean(variant.madeToOrder)

  const order = async () => {
    const details = variantLabel(variant)
    const message = `Вітаю! Хочу замовити: ${name}${details ? ` (${details})` : ''}, арт. ${variant.sku}, ${formatPrice(variant.price)}. ${url}`
    // Instagram links can't prefill a message, so it goes to the clipboard
    const copied = await copy(message)
    setNotice(
      copied
        ? 'Текст замовлення скопійовано — вставте його в повідомлення в Instagram.'
        : `Скопіюйте й надішліть нам: ${message}`,
    )
    track('generate_lead', {
      currency: 'UAH',
      value: variant.price,
      items: [
        { item_id: variant.sku, item_name: name, price: variant.price, item_category: category },
      ],
    })
    if (instagramDirect) window.open(instagramDirect, '_blank', 'noopener,noreferrer')
  }

  return (
    <div>
      <p className="flex items-baseline gap-3">
        <span className="text-2xl font-medium">{formatPrice(variant.price)}</span>
        {variant.oldPrice && <s className="text-muted">{formatPrice(variant.oldPrice)}</s>}
      </p>
      <p className="mt-2 text-sm text-muted">
        Артикул: {variant.sku} ·{' '}
        {(variant.quantity ?? 0) > 0
          ? 'В наявності'
          : variant.madeToOrder
            ? 'Під замовлення'
            : 'Немає в наявності'}
      </p>

      {variants.length > 1 && (
        <fieldset className="mt-6">
          <legend className="mb-3 text-sm">Варіант</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v, i) => (
              <button
                key={v.sku}
                type="button"
                onClick={() => setIndex(i)}
                aria-pressed={i === index}
                className={`border px-4 py-2 text-sm ${
                  i === index
                    ? 'border-forest bg-forest text-ivory'
                    : 'border-sand hover:border-ink'
                } ${(v.quantity ?? 0) > 0 || v.madeToOrder ? '' : 'text-muted line-through'}`}
              >
                {chipLabel(v)}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <button
        type="button"
        onClick={order}
        disabled={!available}
        className="btn-beige mt-8 w-full py-4 disabled:opacity-50"
      >
        <InstagramIcon className="h-5 w-5" />
        {available ? 'Замовити в Instagram' : 'Немає в наявності'}
      </button>
      {!instagramDirect && (
        <p className="mt-2 text-xs text-muted">Instagram магазину ще не вказано в налаштуваннях.</p>
      )}
      <p role="status" aria-live="polite" className="mt-3 text-sm text-forest">
        {notice}
      </p>
      <FavoriteButton slug={slug} withLabel className="mt-4" />
    </div>
  )
}

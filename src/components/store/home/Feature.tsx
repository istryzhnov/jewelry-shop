import Link from 'next/link'

import type { Media } from '@/payload-types'

import { ArrowIcon, RingsIcon } from '../icons'
import { ProductImage } from '../ProductImage'

type FeatureProps = {
  eyebrow: string
  title: string
  text?: string | null
  href: string
  image: Media | null
  tone: 'cream' | 'forest'
  imageSide: 'left' | 'right'
}

// Design A's "Gift Guides" / "Fine Jewelry" blocks: arched photo with an offset outline
export function Feature({ eyebrow, title, text, href, image, tone, imageSide }: FeatureProps) {
  const dark = tone === 'forest'
  return (
    <section className={dark ? 'bg-forest text-ivory' : 'bg-cream'}>
      <div className="container-page grid items-center gap-10 py-16 lg:grid-cols-2 lg:gap-20 lg:py-20">
        <div
          className={`relative mx-auto w-full max-w-md ${imageSide === 'right' ? 'lg:order-2' : ''}`}
        >
          <div
            className={`absolute -left-4 top-6 h-full w-full rounded-t-full border ${dark ? 'border-ivory/40' : 'border-ink/40'}`}
            aria-hidden
          />
          <ProductImage
            media={image}
            alt={title}
            sizes="(min-width: 1024px) 28rem, 90vw"
            className="relative aspect-[4/5] w-full rounded-t-full"
          />
        </div>
        <div className="max-w-lg">
          <RingsIcon className={`h-8 w-8 ${dark ? 'text-ivory' : 'text-ink'}`} />
          <p className={`mt-4 text-sm ${dark ? 'text-beige' : 'text-bronze'}`}>{eyebrow}</p>
          <h2 className="mt-2 font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
            {title}
          </h2>
          {text && (
            <p
              className={`mt-5 font-light leading-relaxed ${dark ? 'text-ivory/80' : 'text-muted'}`}
            >
              {text}
            </p>
          )}
          <Link
            href={href}
            className={`btn-outline mt-8 ${dark ? 'hover:bg-ivory hover:text-forest' : ''}`}
          >
            Дивитись <ArrowIcon />
          </Link>
        </div>
      </div>
    </section>
  )
}

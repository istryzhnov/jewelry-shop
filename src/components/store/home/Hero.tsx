import Link from 'next/link'

import type { Media } from '@/payload-types'

import { ArrowIcon } from '../icons'
import { ProductImage } from '../ProductImage'

type HeroProps = {
  title: string
  subtitle?: string | null
  buttonText?: string | null
  buttonLink?: string | null
  image: Media | null
}

// Design A: wide photo overlapping a deep-green panel, oversized serif title on the panel
export function Hero({ title, subtitle, buttonText, buttonLink, image }: HeroProps) {
  return (
    <section className="relative">
      <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-forest lg:block" aria-hidden />
      <div className="container-page relative grid items-center lg:grid-cols-12">
        <div className="relative lg:col-span-8 lg:col-start-1 lg:row-start-1 lg:py-16">
          <ProductImage
            media={image}
            alt={title}
            priority
            sizes="(min-width: 1024px) 75vw, 100vw"
            className="aspect-[4/3] w-full lg:aspect-[2/1]"
          />
        </div>
        <div className="relative z-10 -mx-4 bg-forest px-6 py-10 text-ivory sm:-mx-6 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:mx-0 lg:bg-transparent lg:px-0 lg:py-0 lg:pl-16">
          <h1 className="font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl xl:text-8xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-6 max-w-sm font-light leading-relaxed text-ivory/85">{subtitle}</p>
          )}
          {buttonText && buttonLink && (
            <Link
              href={buttonLink}
              className="mt-6 inline-flex items-center gap-2 font-display text-lg hover:text-beige"
            >
              {buttonText} <ArrowIcon />
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

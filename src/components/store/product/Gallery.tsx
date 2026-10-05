'use client'

import { useState } from 'react'

import type { Media } from '@/payload-types'

import { ProductImage } from '../ProductImage'

export function Gallery({ images, name }: { images: Media[]; name: string }) {
  const [active, setActive] = useState(0)

  if (!images.length)
    return <ProductImage media={null} sizes="50vw" className="aspect-[4/5] w-full" />

  return (
    <div className="lg:grid lg:grid-cols-[5rem_1fr] lg:gap-4">
      <div className="hidden max-h-[42rem] flex-col gap-3 overflow-y-auto lg:flex">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Фото ${i + 1}`}
            aria-current={i === active}
            className={`shrink-0 border-2 ${i === active ? 'border-forest' : 'border-transparent opacity-70 hover:opacity-100'}`}
          >
            <ProductImage
              media={img}
              alt={`${name}, фото ${i + 1}`}
              sizes="5rem"
              className="aspect-square w-full"
            />
          </button>
        ))}
      </div>
      <div className="hidden lg:block">
        <ProductImage
          media={images[active]}
          alt={`${name}, фото ${active + 1}`}
          sizes="(min-width: 1280px) 40rem, 50vw"
          priority
          className="aspect-[4/5] w-full"
        />
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:hidden">
        {images.map((img, i) => (
          <ProductImage
            key={img.id}
            media={img}
            alt={`${name}, фото ${i + 1}`}
            sizes="85vw"
            priority={i === 0}
            className="aspect-[4/5] w-[85%] shrink-0 snap-center"
          />
        ))}
      </div>
    </div>
  )
}

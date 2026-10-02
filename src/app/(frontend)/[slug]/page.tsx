import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getPageBySlug } from '@/lib/catalog'

export const revalidate = 600

export const generateStaticParams = () => []

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getPageBySlug((await params).slug)
  return page ? { title: page.title } : {}
}

export default async function ContentPage({ params }: Props) {
  const page = await getPageBySlug((await params).slug)
  if (!page) notFound()

  return (
    <article className="container-page max-w-3xl pt-6">
      <h1 className="font-display text-4xl sm:text-5xl">{page.title}</h1>
      {page.content && (
        <RichText
          data={page.content}
          className="mt-8 space-y-4 leading-relaxed text-muted [&_a]:text-forest [&_a]:underline [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink [&_ul]:list-disc [&_ul]:pl-6"
        />
      )}
    </article>
  )
}

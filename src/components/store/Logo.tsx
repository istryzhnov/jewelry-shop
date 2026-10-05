import Link from 'next/link'

export function Logo({ name, className = '' }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
  return (
    <Link
      href="/"
      className={`flex items-center gap-3 ${className}`}
      aria-label={`${name} — на головну`}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ink/60 font-display text-base tracking-wider">
        {initials}
      </span>
      <span className="hidden font-display text-lg leading-tight sm:block">{name}</span>
    </Link>
  )
}

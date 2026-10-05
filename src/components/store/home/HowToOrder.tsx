const STEPS = [
  {
    title: 'Оберіть прикрасу',
    text: 'Знайдіть у каталозі те, що до душі, і оберіть розмір чи варіант.',
  },
  {
    title: 'Напишіть нам в Instagram',
    text: 'Натисніть «Замовити в Instagram» — назва й артикул скопіюються, залишиться лише вставити їх у повідомлення.',
  },
  {
    title: 'Узгодимо деталі',
    text: 'Підтвердимо наявність, оплату й доставку Новою Поштою або Укрпоштою.',
  },
]

export function HowToOrder() {
  return (
    <section className="container-page py-20 lg:py-24">
      <div className="text-center">
        <p className="eyebrow">Просто й зручно</p>
        <h2 className="mt-2 font-display text-4xl sm:text-5xl lg:text-6xl">Як замовити</h2>
      </div>
      <ol className="mt-14 grid gap-10 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-bronze font-display text-xl text-bronze">
              {i + 1}
            </span>
            <h3 className="mt-5 font-display text-xl">{step.title}</h3>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

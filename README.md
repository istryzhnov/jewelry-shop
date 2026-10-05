# jewelry-shop

Каталог ювелірних прикрас: Next.js + Payload CMS 3, PostgreSQL, Cloudflare R2, хостинг на Netlify.

## Локальний запуск

```sh
cp .env.example .env   # задати PAYLOAD_SECRET
npm install
npm run db:up          # Postgres у Docker на порту 5434
npm run seed           # тестовий каталог (npm run seed -- reset, щоб перестворити)
npm run dev
```

- Сайт: http://localhost:3000
- Адмінка: http://localhost:3000/admin (перший вхід створює адміністратора)

## Імпорт прайсу

В адмінці: **Каталог → Імпорт прайсу** → завантажити .xlsx → переглянути звіт → «Застосувати».
Фото з папок Google Drive (посилання в колонці «Фото посилання») завантажуються у фоні;
товари з фото публікуються автоматично, без фото лишаються чернетками.

Перше велике завантаження зручніше зробити з консолі (працює і проти продакшн-бази через `.env`):

```sh
npm run import -- "прайс.xlsx"                    # лише звіт
npm run import -- "прайс.xlsx" apply              # застосувати + фото
npm run import -- "прайс.xlsx" apply no-photos    # без фото
npm run import -- "прайс.xlsx" apply photo-limit=5
```

Роздрібна ціна = закупівельна × (1 + націнка %) з округленням вгору — **Налаштування → Націнка**.

## SEO й аналітика

- Поки `SITE_INDEXABLE` не `true`, сайт закритий від пошуковиків (`robots.txt` + `noindex`). Вмикати після підключення домену.
- `/sitemap.xml` — карта сайту; `/feed.xml` — фід товарів для Google Merchant Center і Meta Catalog.
- GA4 і Meta Pixel: ID в **Налаштування → Аналітика**. Теги вантажаться лише після згоди відвідувача в банері cookie.
  Події: `view_item`, `view_item_list`, `search`, `generate_lead` (клік «Замовити в Instagram»; у Pixel — `Contact`).

## Тести

```sh
npm run test:int                         # окрема база jewelry_shop_test (TEST_DATABASE_URL)
PW_CHANNEL=chrome npx playwright test    # E2E; потрібен засіяний каталог
```

## Міграції

Локально схема БД оновлюється автоматично. Після зміни колекцій створити міграцію:

```sh
npm run payload -- migrate:create <name>
```

У продакшні міграції застосовуються автоматично при старті.

`npm run build` рендерить сторінки з бази, тому запускайте його проти бази з міграціями (як у CI),
а не проти локальної dev-бази, схему якої створював push-режим — там збірка зависне на питанні Payload.

## Деплой (Netlify)

Змінні середовища: `DATABASE_URL` (Neon), `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`,
`S3_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` (Cloudflare R2), `CRON_SECRET`.

Фонові задачі (пакети імпорту, фото) виконує планова функція `netlify/functions/run-jobs.mts`
щохвилини через `POST /api/jobs/tick`. Локально їх запускає сам dev-сервер.

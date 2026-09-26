import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { s3Storage } from '@payloadcms/storage-s3'
import { uk } from '@payloadcms/translations/languages/uk'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Categories } from './collections/Categories'
import { ImportRuns } from './collections/ImportRuns'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { ProductCollections } from './collections/ProductCollections'
import { Products } from './collections/Products'
import { Users } from './collections/Users'
import { Homepage } from './globals/Homepage'
import { Settings } from './globals/Settings'
import { importRowsTask, QUEUES, releaseStaleJobs, syncPhotosTask } from './jobs'
import { jobsTick } from './jobs/tickEndpoint'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || '',
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' — Адмінка',
    },
  },
  i18n: {
    supportedLanguages: { uk },
    fallbackLanguage: 'uk',
  },
  collections: [Products, Categories, ProductCollections, ImportRuns, Pages, Media, Users],
  globals: [Homepage, Settings],
  jobs: {
    tasks: [importRowsTask, syncPhotosTask],
    deleteJobOnComplete: true,
    // In-process runner for long-lived servers (local dev); serverless relies on the scheduled function
    autoRun: [
      { cron: '*/10 * * * * *', queue: QUEUES.import, limit: 1 },
      { cron: '*/10 * * * * *', queue: QUEUES.photos, limit: 3 },
    ],
    shouldAutoRun: async (payload) => {
      if (process.env.NETLIFY || process.env.NODE_ENV === 'test') return false
      await releaseStaleJobs(payload)
      return true
    },
  },
  endpoints: [jobsTick],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // Locally the schema is pushed automatically; in production only migrations are applied
    push: process.env.NODE_ENV !== 'production',
    migrationDir: path.resolve(dirname, 'migrations'),
    prodMigrations: migrations,
  }),
  sharp,
  plugins: [
    seoPlugin({
      collections: ['products', 'categories', 'product-collections', 'pages'],
      uploadsCollection: 'media',
      generateTitle: ({ doc }) => doc?.name || doc?.title || '',
      generateDescription: ({ doc }) =>
        typeof doc?.description === 'string' ? doc.description : '',
    }),
    // Media goes to Cloudflare R2 when configured; otherwise stored on local disk (dev only)
    s3Storage({
      enabled: Boolean(process.env.S3_BUCKET),
      collections: { media: true, 'import-runs': { prefix: 'imports' } },
      bucket: process.env.S3_BUCKET || '',
      config: {
        endpoint: process.env.S3_ENDPOINT,
        region: 'auto',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      },
    }),
  ],
})

import { getPayload } from 'payload'

import config from '@payload-config'
import { clearCatalog, seed } from '@/seed'

const payload = await getPayload({ config })
const { totalDocs } = await payload.count({ collection: 'products' })

if (totalDocs > 0 && !process.argv.includes('reset')) {
  payload.logger.info(
    'Каталог не порожній. Запустіть з reset (npm run seed -- reset), щоб перестворити тестові дані.',
  )
} else {
  await clearCatalog(payload)
  await seed(payload)
  payload.logger.info('Тестовий каталог створено')
}
process.exit(0)

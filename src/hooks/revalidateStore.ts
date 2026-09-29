import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

// Storefront pages are cached; any catalog/content change marks the whole site stale
// Imported lazily: plain Node scripts (CLI import, seed, tests) cannot resolve next/cache
async function revalidateStore() {
  try {
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/', 'layout')
  } catch {
    // Outside a Next.js request there is no cache to revalidate
  }
}

export const revalidateOnChange: CollectionAfterChangeHook = async ({ doc }) => {
  await revalidateStore()
  return doc
}

export const revalidateOnDelete: CollectionAfterDeleteHook = async ({ doc }) => {
  await revalidateStore()
  return doc
}

export const revalidateGlobal: GlobalAfterChangeHook = async ({ doc }) => {
  await revalidateStore()
  return doc
}

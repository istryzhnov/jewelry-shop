import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

// Lazy import: plain Node scripts cannot resolve next/cache
async function revalidateStore() {
  try {
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/', 'layout')
  } catch {}
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

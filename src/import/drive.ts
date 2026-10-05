export type Fetcher = (url: string) => Promise<Response>

export type DriveImage = { id: string; name: string }

export function folderIdFromUrl(url: string): string | null {
  return url.match(/\/folders\/([\w-]+)/)?.[1] ?? url.match(/[?&]id=([\w-]+)/)?.[1] ?? null
}

// The embeddable folder view lists public folders without an API key
export async function listFolderImages(
  folderId: string,
  fetcher: Fetcher = fetch,
): Promise<DriveImage[]> {
  const res = await fetcher(`https://drive.google.com/embeddedfolderview?id=${folderId}`)
  if (!res.ok)
    throw new Error(
      `папка недоступна (HTTP ${res.status}) — перевірте, що доступ відкрито за посиланням`,
    )
  const html = await res.text()
  const entry = /id="entry-([\w-]+)"[\s\S]*?\/type\/([^"]+)"[\s\S]*?flip-entry-title">([^<]+)</g
  const images: DriveImage[] = []
  for (const [, id, mime, name] of html.matchAll(entry)) {
    if (mime.startsWith('image/')) images.push({ id, name: name.trim() })
  }
  return images.sort((a, b) => a.name.localeCompare(b.name, 'uk', { numeric: true }))
}

// Google serves a resized JPEG, also for HEIC originals
export async function downloadImage(fileId: string, fetcher: Fetcher = fetch): Promise<Buffer> {
  const res = await fetcher(`https://lh3.googleusercontent.com/d/${fileId}=w1600`)
  const type = res.headers.get('content-type') ?? ''
  if (!res.ok || !type.startsWith('image/'))
    throw new Error(`не вдалося завантажити фото ${fileId}`)
  return Buffer.from(await res.arrayBuffer())
}

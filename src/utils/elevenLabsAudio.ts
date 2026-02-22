let available = false

const audioCache = new Map<string, string>()

/** Check ElevenLabs availability from the server. Caches true permanently, retries on false. */
export async function checkElevenLabsAvailability(): Promise<boolean> {
  if (available) return true
  try {
    const res = await fetch('/api/tts/status')
    if (res.ok) {
      const data = await res.json()
      available = !!data.available
    }
  } catch {
    available = false
  }
  return available
}

/** Synchronous getter for cached availability result. */
export function isElevenLabsAvailable(): boolean {
  return available
}

/** Pre-fetch ElevenLabs audio for a list of words. Skips words already cached. */
export async function preloadWords(words: string[]): Promise<void> {
  if (!available) return
  const unique = [...new Set(words.map((w) => w.toLowerCase()))]
  const uncached = unique.filter((w) => !audioCache.has(w))
  await Promise.allSettled(uncached.map((w) => fetchElevenLabsAudio(w)))
}

/** Fetch TTS audio from the server proxy, returning a cached blob URL. */
export async function fetchElevenLabsAudio(text: string): Promise<string | null> {
  const key = text.toLowerCase()
  const cached = audioCache.get(key)
  if (cached) return cached

  try {
    const res = await fetch(`/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) return null
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    audioCache.set(key, url)
    return url
  } catch {
    return null
  }
}

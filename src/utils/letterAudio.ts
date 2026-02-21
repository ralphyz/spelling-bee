import { MW_ELEMENTARY, getMWAudioUrl } from '../config/dictionaries'

interface MWLetterEntry {
  hwi?: {
    prs?: { sound?: { audio?: string } }[]
  }
}

/** Spoken names for letters whose single-character entries lack audio in MW. */
const LETTER_NAME_FALLBACKS: Record<string, string> = {
  b: 'bee',
  g: 'gee',
  o: 'owe',
  t: 'tee',
  u: 'you',
}

const letterAudioUrls = new Map<string, string>()
let capitalAudioUrl: string | null = null
let fetchPromise: Promise<void> | null = null

async function fetchMWAudio(word: string): Promise<string | null> {
  if (!MW_ELEMENTARY.apiKey) return null
  try {
    const res = await fetch(
      `${MW_ELEMENTARY.baseUrl}/${encodeURIComponent(word)}?key=${MW_ELEMENTARY.apiKey}`
    )
    if (!res.ok) return null
    const data: unknown = await res.json()
    if (!Array.isArray(data) || data.length === 0 || typeof data[0] === 'string') return null

    const entry = data[0] as MWLetterEntry
    const audioFile = entry.hwi?.prs?.[0]?.sound?.audio
    if (audioFile) return getMWAudioUrl(audioFile)
    return null
  } catch {
    return null
  }
}

/** Fetch and cache audio URLs for all 26 letters + "capital". Call early to warm the cache. */
export function preloadLetterAudio(): Promise<void> {
  if (fetchPromise) return fetchPromise

  fetchPromise = (async () => {
    const letters = 'abcdefghijklmnopqrstuvwxyz'.split('')

    // Fetch all letters + "capital" in parallel
    const tasks = letters.map(async (letter) => {
      // Try the letter itself first
      let url = await fetchMWAudio(letter)

      // If no audio, try the letter's spoken name (e.g. "tee" for "t")
      if (!url && LETTER_NAME_FALLBACKS[letter]) {
        url = await fetchMWAudio(LETTER_NAME_FALLBACKS[letter])
      }

      if (url) letterAudioUrls.set(letter, url)
    })

    // Also fetch "capital" audio
    tasks.push(
      fetchMWAudio('capital').then((url) => {
        capitalAudioUrl = url
      })
    )

    await Promise.allSettled(tasks)
  })()

  return fetchPromise
}

/** Get the cached audio URL for a letter, or null if not available. */
export function getLetterAudioUrl(letter: string): string | null {
  return letterAudioUrls.get(letter.toLowerCase()) || null
}

/** Get the cached audio URL for "capital", or null if not available. */
export function getCapitalAudioUrl(): string | null {
  return capitalAudioUrl
}

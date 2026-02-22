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
let preloaded = false

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

/**
 * Populate letter audio from static ElevenLabs files in /audio/letters/.
 * Falls back to Merriam-Webster for any letter that fails to load.
 */
export function preloadLetterAudio(): Promise<void> {
  if (preloaded) return Promise.resolve()
  preloaded = true

  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('')

  const tasks = letters.map(async (letter) => {
    const staticUrl = `/audio/letters/${letter}.mp3`
    // Verify the static file exists with a HEAD request
    try {
      const res = await fetch(staticUrl, { method: 'HEAD' })
      if (res.ok) {
        letterAudioUrls.set(letter, staticUrl)
        return
      }
    } catch { /* fall through to MW */ }

    // Fallback: Merriam-Webster
    let url = await fetchMWAudio(letter)
    if (!url && LETTER_NAME_FALLBACKS[letter]) {
      url = await fetchMWAudio(LETTER_NAME_FALLBACKS[letter])
    }
    if (url) letterAudioUrls.set(letter, url)
  })

  // Capital audio
  tasks.push((async () => {
    try {
      const res = await fetch('/audio/letters/capital.mp3', { method: 'HEAD' })
      if (res.ok) {
        capitalAudioUrl = '/audio/letters/capital.mp3'
        return
      }
    } catch { /* fall through */ }
    capitalAudioUrl = await fetchMWAudio('capital')
  })())

  return Promise.allSettled(tasks).then(() => {})
}

/** Get the cached audio URL for a letter, or null if not available. */
export function getLetterAudioUrl(letter: string): string | null {
  return letterAudioUrls.get(letter.toLowerCase()) || null
}

/** Get the cached audio URL for "capital", or null if not available. */
export function getCapitalAudioUrl(): string | null {
  return capitalAudioUrl
}

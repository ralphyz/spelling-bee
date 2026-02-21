import type { WordEntry } from '../types'
import { MW_ELEMENTARY, MW_INTERMEDIATE, MW_COLLEGIATE, MW_LEARNERS, getMWAudioUrl } from '../config/dictionaries'

// — Merriam-Webster types —

interface MWSense {
  dt: [string, unknown][]
}

interface MWEntry {
  meta?: { id?: string; stems?: string[] }
  fl?: string
  shortdef?: string[]
  hwi?: {
    prs?: { sound?: { audio?: string } }[]
  }
  def?: { sseq: [string, MWSense | { sense: MWSense }][][] }[]
}

// — Free Dictionary API types —

interface DictionaryPhonetic {
  audio?: string
  text?: string
}

interface DictionaryMeaning {
  partOfSpeech: string
  definitions: {
    definition: string
    example?: string
  }[]
}

interface DictionaryResponse {
  word: string
  phonetic?: string
  phonetics?: DictionaryPhonetic[]
  meanings?: DictionaryMeaning[]
}

// — Wiktionary types —

interface WiktionaryDefinition {
  definition: string
}

interface WiktionaryEntry {
  partOfSpeech: string
  definitions: WiktionaryDefinition[]
}

interface WiktionaryResponse {
  en?: WiktionaryEntry[]
}

function decodeEntities(text: string): string {
  const el = document.createElement('textarea')
  el.innerHTML = text
  return el.value
}

function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, '').replace(/\n.*/g, '').trim())
}

/** Build a set of stems from a word by stripping common suffixes. */
function getWordStems(word: string): string[] {
  const lower = word.toLowerCase()
  const stems = new Set<string>([lower])

  const suffixes = [
    'ically', 'ously', 'ively', 'fully', 'lessly', 'ingly', 'edly', 'ably', 'ibly',
    'ation', 'ition', 'ness', 'ment', 'ence', 'ance', 'able', 'ible',
    'ful', 'less', 'ous', 'ive', 'ity',
    'ing', 'ly', 'ed', 'er', 'est', 'en', 'al', 'es', 's',
  ]

  for (const suffix of suffixes) {
    if (lower.endsWith(suffix) && lower.length - suffix.length >= 3) {
      const stem = lower.slice(0, -suffix.length)
      stems.add(stem)
      // Handle consonant doubling: "running" → "runn" → "run"
      if (stem.length >= 4 && stem[stem.length - 1] === stem[stem.length - 2]) {
        stems.add(stem.slice(0, -1))
      }
      // Handle y→i: "happiness" → "happi" → "happy"
      if (stem.endsWith('i')) {
        stems.add(stem.slice(0, -1) + 'y')
      }
    }
  }

  return Array.from(stems)
}

/** Check if a definition circularly references the word or a variation of it. */
function definitionReferencesWord(word: string, definition: string): boolean {
  const wordLower = word.toLowerCase()
  const defLower = definition.toLowerCase()

  // Reject if the definition is just part of the word (e.g. "night" for "nighttime")
  if (wordLower.includes(defLower)) return true

  const stems = getWordStems(word)
  return stems.some((stem) => defLower.includes(stem))
}

export function extractWordEntry(data: DictionaryResponse[], word?: string): Omit<WordEntry, 'word'> {
  const entry = data[0]
  if (!entry) {
    return {
      definition: '',
      partOfSpeech: '',
      example: '',
      audioUrl: null,
      phonetic: '',
    }
  }

  // find first audio URL (prefer US pronunciation)
  let audioUrl: string | null = null
  if (entry.phonetics) {
    const usAudio = entry.phonetics.find(
      (p) => p.audio && p.audio.includes('-us')
    )
    const anyAudio = entry.phonetics.find((p) => p.audio && p.audio.length > 0)
    audioUrl = usAudio?.audio || anyAudio?.audio || null
  }

  const phonetic =
    entry.phonetic ||
    entry.phonetics?.find((p) => p.text)?.text ||
    ''

  // Find first definition that doesn't circularly reference the word
  let bestDef = ''
  let bestPos = ''
  let bestExample = ''

  for (const meaning of entry.meanings || []) {
    for (const def of meaning.definitions) {
      if (!def.definition) continue
      const cleaned = decodeEntities(def.definition)
      if (word && definitionReferencesWord(word, cleaned)) continue
      bestDef = cleaned
      bestPos = meaning.partOfSpeech
      bestExample = def.example ? decodeEntities(def.example) : ''
      break
    }
    if (bestDef) break
  }

  return {
    definition: bestDef,
    partOfSpeech: bestPos || entry.meanings?.[0]?.partOfSpeech || '',
    example: bestExample,
    audioUrl,
    phonetic,
  }
}

async function fetchWiktionaryDefinition(word: string, pos?: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`
    )
    if (!res.ok) return null
    const data = (await res.json()) as WiktionaryResponse
    const entries = data.en || []

    // If a specific POS is requested, try that first
    if (pos) {
      const match = entries.find((e) => e.partOfSpeech.toLowerCase() === pos.toLowerCase())
      if (match && match.definitions.length > 0) {
        const defs = match.definitions
          .map((d) => stripHtml(d.definition))
          .filter((d) => d.length > 0 && !definitionReferencesWord(word, d))
          .slice(0, 2)
        if (defs.length > 0) return defs.join('; ')
      }
    }

    // Otherwise take the first entry with definitions
    for (const entry of entries) {
      const defs = entry.definitions
        .map((d) => stripHtml(d.definition))
        .filter((d) => d.length > 0 && !definitionReferencesWord(word, d))
        .slice(0, 2)
      if (defs.length > 0) return defs.join('; ')
    }

    return null
  } catch {
    return null
  }
}

/** Try a single Merriam-Webster dictionary (Elementary or Intermediate). */
async function fetchMWFrom(
  dict: { baseUrl: string; apiKey: string },
  word: string
): Promise<Omit<WordEntry, 'word'> | null> {
  if (!dict.apiKey) return null

  try {
    const res = await fetch(
      `${dict.baseUrl}/${encodeURIComponent(word.toLowerCase())}?key=${dict.apiKey}`
    )
    if (!res.ok) return null

    const data: unknown = await res.json()

    // MW returns an array of strings (suggestions) when the word isn't found
    if (!Array.isArray(data) || data.length === 0 || typeof data[0] === 'string') {
      return null
    }

    const entries = data as MWEntry[]
    const entry = entries[0]

    // Audio — only use if the entry's headword matches the queried word
    // (e.g. don't use "outfit" audio for "outfits")
    let audioUrl: string | null = null
    const headword = (entry.meta?.id || '').replace(/:.*$/, '').toLowerCase()
    const audioFile = entry.hwi?.prs?.[0]?.sound?.audio
    if (audioFile && headword === word.toLowerCase()) {
      audioUrl = getMWAudioUrl(audioFile)
    }

    // Definition — use shortdef (kid-friendly summary), skip self-referential ones
    let definition = ''
    for (const e of entries) {
      for (const sd of e.shortdef || []) {
        const cleaned = decodeEntities(sd)
        if (!definitionReferencesWord(word, cleaned)) {
          definition = cleaned
          break
        }
      }
      if (definition) break
    }

    return {
      definition,
      partOfSpeech: entry.fl || '',
      example: '',
      audioUrl,
      phonetic: '',
    }
  } catch {
    return null
  }
}

/** Try MW dictionaries in order: Elementary → Intermediate → Learner's → Collegiate.
 *  Prefer kid-friendly definitions but pick up audio from whichever source has an exact match. */
async function fetchMWEntry(word: string): Promise<Omit<WordEntry, 'word'> | null> {
  const dicts = [MW_ELEMENTARY, MW_INTERMEDIATE, MW_LEARNERS, MW_COLLEGIATE]
  const results = await Promise.all(dicts.map((d) => fetchMWFrom(d, word)))

  // Pick the first result that has a definition
  let best: Omit<WordEntry, 'word'> | null = null
  for (const r of results) {
    if (r?.definition) {
      best = r
      break
    }
  }

  // If none had a definition, use the first non-null result (may have audio)
  if (!best) {
    best = results.find((r) => r !== null) || null
  }

  if (!best) return null

  // If the best result has no audio, grab audio from any result that does
  if (!best.audioUrl) {
    for (const r of results) {
      if (r?.audioUrl) {
        best = { ...best, audioUrl: r.audioUrl }
        break
      }
    }
  }

  return best
}

export async function fetchWordData(
  word: string
): Promise<Omit<WordEntry, 'word'>> {
  const isProperNoun = word.length > 0 && word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()

  // 1. Try Merriam-Webster Elementary dictionary (kid-friendly definitions)
  const mwEntry = await fetchMWEntry(word)

  // 2. Fetch free dictionary for audio/phonetics (MW audio may be missing or we may want fallback)
  let freeEntry: Omit<WordEntry, 'word'> = {
    definition: '',
    partOfSpeech: '',
    example: '',
    audioUrl: null,
    phonetic: '',
  }

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`
    )
    if (res.ok) {
      const data: DictionaryResponse[] = await res.json()
      freeEntry = extractWordEntry(data, word)
    }
  } catch {
    // continue
  }

  // Merge: prefer MW definition, use best available audio
  const result: Omit<WordEntry, 'word'> = {
    definition: mwEntry?.definition || freeEntry.definition,
    partOfSpeech: mwEntry?.partOfSpeech || freeEntry.partOfSpeech,
    example: freeEntry.example,
    audioUrl: mwEntry?.audioUrl || freeEntry.audioUrl,
    phonetic: freeEntry.phonetic,
  }

  if (isProperNoun && !result.definition) {
    const properDef = await fetchWiktionaryDefinition(word, 'Proper noun')
    return {
      ...result,
      definition: properDef || `${word} (proper noun)`,
      partOfSpeech: 'proper noun',
    }
  }

  // Fallback to Wiktionary if still no definition
  if (!result.definition) {
    const wiktDef = await fetchWiktionaryDefinition(word.toLowerCase())
    if (wiktDef) {
      result.definition = wiktDef
    }
  }

  return result
}

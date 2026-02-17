import type { WordEntry } from '../types'

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

export function extractWordEntry(data: DictionaryResponse[]): Omit<WordEntry, 'word'> {
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

  const meaning = entry.meanings?.[0]
  const def = meaning?.definitions?.[0]

  return {
    definition: def?.definition || '',
    partOfSpeech: meaning?.partOfSpeech || '',
    example: def?.example || '',
    audioUrl,
    phonetic,
  }
}

export async function fetchWordData(
  word: string
): Promise<Omit<WordEntry, 'word'>> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    )
    if (!res.ok) {
      return {
        definition: '',
        partOfSpeech: '',
        example: '',
        audioUrl: null,
        phonetic: '',
      }
    }
    const data: DictionaryResponse[] = await res.json()
    return extractWordEntry(data)
  } catch {
    return {
      definition: '',
      partOfSpeech: '',
      example: '',
      audioUrl: null,
      phonetic: '',
    }
  }
}

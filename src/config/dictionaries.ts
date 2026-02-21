/**
 * Merriam-Webster Dictionary API Configuration
 *
 * Register for free API keys at: https://dictionaryapi.com/
 * Keys are stored in .env as VITE_MW_*_API_KEY
 *
 * Elementary Dictionary (sd2) — Grades 3-5, 36,000+ entries
 *   https://www.dictionaryapi.com/api/v3/references/sd2/json/{word}?key={VITE_MW_ELEMENTARY_API_KEY}
 *
 * Intermediate Dictionary (sd3) — Grades 6-8, 65,000+ entries
 *   https://www.dictionaryapi.com/api/v3/references/sd3/json/{word}?key={VITE_MW_INTERMEDIATE_API_KEY}
 *
 * Collegiate Dictionary — collegiate
 *   https://www.dictionaryapi.com/api/v3/references/collegiate/json/{word}?key={VITE_MW_COLLEGIATE_API_KEY}
 *
 * Learner's Dictionary — learners
 *   https://www.dictionaryapi.com/api/v3/references/learners/json/{word}?key={VITE_MW_LEARNERS_API_KEY}
 *
 * Audio pronunciation URL pattern:
 *   https://media.merriam-webster.com/audio/prons/en/us/mp3/{subdir}/{filename}.mp3
 *   subdir rules: "bix" prefix → "bix", "gg" prefix → "gg", number prefix → "number", else first char
 */

export const MW_ELEMENTARY = {
  ref: 'sd2',
  name: 'Elementary Dictionary',
  grades: '3-5',
  baseUrl: 'https://www.dictionaryapi.com/api/v3/references/sd2/json',
  apiKey: import.meta.env.VITE_MW_ELEMENTARY_API_KEY || '',
} as const

export const MW_INTERMEDIATE = {
  ref: 'sd3',
  name: 'Intermediate Dictionary',
  grades: '6-8',
  baseUrl: 'https://www.dictionaryapi.com/api/v3/references/sd3/json',
  apiKey: import.meta.env.VITE_MW_INTERMEDIATE_API_KEY || '',
} as const

export const MW_COLLEGIATE = {
  ref: 'collegiate',
  name: 'Collegiate Dictionary',
  baseUrl: 'https://www.dictionaryapi.com/api/v3/references/collegiate/json',
  apiKey: import.meta.env.VITE_MW_COLLEGIATE_API_KEY || '',
} as const

export const MW_LEARNERS = {
  ref: 'learners',
  name: "Learner's Dictionary",
  baseUrl: 'https://www.dictionaryapi.com/api/v3/references/learners/json',
  apiKey: import.meta.env.VITE_MW_LEARNERS_API_KEY || '',
} as const

export const MW_AUDIO_BASE = 'https://media.merriam-webster.com/audio/prons/en/us/mp3'

/** Determine the audio subdirectory from the filename per MW's rules. */
export function getMWAudioSubdir(filename: string): string {
  if (filename.startsWith('bix')) return 'bix'
  if (filename.startsWith('gg')) return 'gg'
  if (/^\d/.test(filename)) return 'number'
  return filename[0]
}

/** Build the full audio URL from an MW audio filename. */
export function getMWAudioUrl(filename: string): string {
  return `${MW_AUDIO_BASE}/${getMWAudioSubdir(filename)}/${filename}.mp3`
}

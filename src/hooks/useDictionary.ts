import { useState, useCallback } from 'react'
import type { WordEntry } from '../types'
import { fetchWordData } from '../utils/audioUtils'

export function useDictionary() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const fetchWords = useCallback(
    async (words: string[]): Promise<WordEntry[]> => {
      setLoading(true)
      setProgress(0)

      const results: WordEntry[] = []

      for (let i = 0; i < words.length; i++) {
        const word = words[i]
        const data = await fetchWordData(word)
        results.push({ word, ...data })
        setProgress(((i + 1) / words.length) * 100)
        // small delay to avoid rate limiting
        if (i < words.length - 1) {
          await new Promise((r) => setTimeout(r, 200))
        }
      }

      setLoading(false)
      return results
    },
    []
  )

  return { fetchWords, loading, progress }
}

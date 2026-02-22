import { useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { checkElevenLabsAvailability, preloadWords } from '../utils/elevenLabsAudio'
import { preloadLetterAudio } from '../utils/letterAudio'

/**
 * Preloads audio for the active word list and all letters.
 * Letters use static files; words use ElevenLabs (if available) with disk cache.
 */
export function useAudioPreload() {
  const { state } = useApp()
  const preloadedListId = useRef<string | null>(null)

  // Preload letters once on mount
  useEffect(() => {
    preloadLetterAudio()
  }, [])

  // Preload words when the active list changes
  useEffect(() => {
    const activeList = state.wordLists.find((l) => l.id === state.activeListId)
    if (!activeList) return
    if (preloadedListId.current === activeList.id) return

    let cancelled = false

    ;(async () => {
      const available = await checkElevenLabsAvailability()
      if (cancelled || !available) return

      const words = activeList.words.map((w) => w.word)
      await preloadWords(words)

      if (!cancelled) {
        preloadedListId.current = activeList.id
      }
    })()

    return () => { cancelled = true }
  }, [state.activeListId, state.wordLists])
}

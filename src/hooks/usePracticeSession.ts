import { useState, useCallback, useEffect, useRef } from 'react'
import type { WordEntry, PracticeSessionState } from '../types'

const STORAGE_KEY = 'spelling-bee-practice-session'

function loadSession(): PracticeSessionState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as PracticeSessionState
  } catch { /* ignore */ }
  return null
}

function saveToStorage(session: PracticeSessionState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch { /* ignore */ }
}

function clearStorage() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}

export function usePracticeSession(words: WordEntry[], listId: string) {
  const [session, setSession] = useState<PracticeSessionState>(() => {
    const saved = loadSession()
    if (saved && saved.listId === listId && saved.phase !== 'done' && saved.words.length > 0) {
      return saved
    }
    return {
      phase: 'typing',
      words,
      currentIndex: 0,
      typedLetters: [],
      results: [],
      listId,
    }
  })

  const skipSave = useRef(false)
  const cursorRef = useRef<number | null>(null)

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    saveToStorage(session)
  }, [session])

  const typeLetter = useCallback((letter: string) => {
    const cursor = cursorRef.current
    cursorRef.current = null
    setSession((s) => {
      if (s.phase !== 'typing') return s
      const currentWord = s.words[s.currentIndex]
      if (!currentWord) return s
      if (cursor !== null) {
        const newLetters = [...s.typedLetters]
        newLetters[cursor] = letter
        return { ...s, typedLetters: newLetters }
      }
      if (s.typedLetters.length >= currentWord.word.length) {
        const emptyIdx = s.typedLetters.findIndex((l) => l === '')
        if (emptyIdx === -1) return s
        const newLetters = [...s.typedLetters]
        newLetters[emptyIdx] = letter
        return { ...s, typedLetters: newLetters }
      }
      return { ...s, typedLetters: [...s.typedLetters, letter] }
    })
  }, [])

  const deleteLetter = useCallback(() => {
    cursorRef.current = null
    setSession((s) => ({
      ...s,
      typedLetters: s.typedLetters.slice(0, -1),
    }))
  }, [])

  const removeLetter = useCallback((index: number) => {
    cursorRef.current = index
    setSession((s) => ({
      ...s,
      typedLetters: s.typedLetters.map((l, i) => i === index ? '' : l),
    }))
  }, [])

  // Returns true if the word was completed correctly
  const checkComplete = useCallback((): boolean => {
    let correct = false
    setSession((s) => {
      const currentWord = s.words[s.currentIndex]
      if (!currentWord) return s
      const typed = s.typedLetters.join('')
      correct = typed === currentWord.word
      if (!correct) return s // Don't advance if wrong

      const newResults = [
        ...s.results,
        { word: currentWord.word, typed, correct: true },
      ]
      const nextIndex = s.currentIndex + 1
      if (nextIndex >= s.words.length) {
        clearStorage()
        return { ...s, phase: 'done', results: newResults }
      }
      return {
        ...s,
        currentIndex: nextIndex,
        typedLetters: [],
        results: newResults,
      }
    })
    return correct
  }, [])

  const reset = useCallback(
    (newWords?: WordEntry[]) => {
      cursorRef.current = null
      clearStorage()
      skipSave.current = true
      const fresh: PracticeSessionState = {
        phase: 'typing',
        words: newWords || words,
        currentIndex: 0,
        typedLetters: [],
        results: [],
        listId,
      }
      setSession(fresh)
      saveToStorage(fresh)
    },
    [words, listId]
  )

  const currentWord = session.words[session.currentIndex] || null

  return {
    session,
    currentWord,
    typeLetter,
    deleteLetter,
    removeLetter,
    checkComplete,
    reset,
  }
}

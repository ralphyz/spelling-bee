import { useState, useCallback, useEffect, useRef } from 'react'
import type { WordEntry, LearnSessionState } from '../types'

const STORAGE_KEY = 'spelling-bee-learn-session'

function loadSession(): LearnSessionState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as LearnSessionState
  } catch { /* ignore */ }
  return null
}

function saveToStorage(session: LearnSessionState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch { /* ignore */ }
}

function clearStorage() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}

export function useLearnSession(words: WordEntry[], listId: string) {
  const [session, setSession] = useState<LearnSessionState>(() => {
    const saved = loadSession()
    // Restore if same list and not done
    if (saved && saved.listId === listId && saved.phase !== 'done' && saved.words.length > 0) {
      return saved
    }
    return {
      phase: 'study',
      words,
      currentIndex: 0,
      typedLetters: [],
      isCorrect: null,
      results: [],
      listId,
    }
  })

  const skipSave = useRef(false)
  const cursorRef = useRef<number | null>(null)

  // Persist session on every change
  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    saveToStorage(session)
  }, [session])

  const startPractice = useCallback(() => {
    cursorRef.current = null
    setSession((s) => ({
      ...s,
      phase: 'practice',
      typedLetters: [],
      isCorrect: null,
    }))
  }, [])

  const typeLetter = useCallback((letter: string) => {
    const cursor = cursorRef.current
    cursorRef.current = null
    setSession((s) => {
      if (cursor !== null) {
        const newLetters = [...s.typedLetters]
        newLetters[cursor] = letter
        return { ...s, typedLetters: newLetters }
      }
      const currentWord = s.words[s.currentIndex]
      if (currentWord && s.typedLetters.length >= currentWord.word.length) {
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

  const checkAnswer = useCallback(() => {
    setSession((s) => {
      const currentWord = s.words[s.currentIndex]
      const typed = s.typedLetters.join('')
      const correct = typed === currentWord.word
      return {
        ...s,
        phase: 'feedback',
        isCorrect: correct,
        results: [
          ...s.results,
          { word: currentWord.word, typed, correct },
        ],
      }
    })
  }, [])

  const next = useCallback(() => {
    cursorRef.current = null
    setSession((s) => {
      const nextIndex = s.currentIndex + 1
      if (nextIndex >= s.words.length) {
        clearStorage()
        return { ...s, phase: 'done' }
      }
      return {
        ...s,
        phase: 'study',
        currentIndex: nextIndex,
        typedLetters: [],
        isCorrect: null,
      }
    })
  }, [])

  const retry = useCallback(() => {
    cursorRef.current = null
    setSession((s) => ({
      ...s,
      phase: 'practice',
      typedLetters: [],
      isCorrect: null,
    }))
  }, [])

  const reset = useCallback(
    (newWords?: WordEntry[]) => {
      cursorRef.current = null
      clearStorage()
      skipSave.current = true
      const fresh: LearnSessionState = {
        phase: 'study',
        words: newWords || words,
        currentIndex: 0,
        typedLetters: [],
        isCorrect: null,
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
    startPractice,
    typeLetter,
    deleteLetter,
    removeLetter,
    checkAnswer,
    next,
    retry,
    reset,
  }
}

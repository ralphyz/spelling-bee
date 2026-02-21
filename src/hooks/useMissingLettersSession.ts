import { useState, useCallback, useEffect, useRef } from 'react'
import type { WordEntry, MissingLettersSessionState } from '../types'

const STORAGE_KEY = 'spelling-bee-missing-letters-session'

function loadSession(): MissingLettersSessionState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as MissingLettersSessionState
  } catch { /* ignore */ }
  return null
}

function saveToStorage(session: MissingLettersSessionState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch { /* ignore */ }
}

function clearStorage() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}

/** Pick ~40-50% of positions to hide, never index 0, always at least 1 */
function generateBlanks(word: string): number[] {
  const len = word.length
  if (len <= 1) return []

  const candidates = Array.from({ length: len - 1 }, (_, i) => i + 1)
  const targetCount = Math.max(1, Math.round(len * 0.45))
  const count = Math.min(targetCount, candidates.length)

  // Fisher-Yates shuffle then take first `count`
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }

  return candidates.slice(0, count).sort((a, b) => a - b)
}

export function useMissingLettersSession(words: WordEntry[], listId: string) {
  const [session, setSession] = useState<MissingLettersSessionState>(() => {
    const saved = loadSession()
    if (saved && saved.listId === listId && saved.phase !== 'done' && saved.words.length > 0) {
      return saved
    }
    const blanks = words.length > 0 ? generateBlanks(words[0].word) : []
    return {
      phase: 'typing',
      words,
      currentIndex: 0,
      typedLetters: [],
      blanks,
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
      if (cursor !== null) {
        const newLetters = [...s.typedLetters]
        newLetters[cursor] = letter
        return { ...s, typedLetters: newLetters }
      }
      if (s.typedLetters.length >= s.blanks.length) {
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

  const checkComplete = useCallback((): boolean => {
    let correct = false
    setSession((s) => {
      const currentWord = s.words[s.currentIndex]
      if (!currentWord) return s

      // Build the full typed word by combining given + typed letters
      const wordLetters = currentWord.word.split('')
      const typed: string[] = []
      let blankIdx = 0
      for (let i = 0; i < wordLetters.length; i++) {
        if (s.blanks.includes(i)) {
          typed.push(s.typedLetters[blankIdx] || '')
          blankIdx++
        } else {
          typed.push(wordLetters[i])
        }
      }
      const typedWord = typed.join('')
      correct = typedWord === currentWord.word
      if (!correct) return s

      const newResults = [
        ...s.results,
        { word: currentWord.word, typed: typedWord, correct: true },
      ]
      const nextIndex = s.currentIndex + 1
      if (nextIndex >= s.words.length) {
        clearStorage()
        return { ...s, phase: 'done', results: newResults }
      }
      const nextBlanks = generateBlanks(s.words[nextIndex].word)
      return {
        ...s,
        currentIndex: nextIndex,
        typedLetters: [],
        blanks: nextBlanks,
        results: newResults,
      }
    })
    return correct
  }, [])

  /** Build the full word string from given letters + typed blanks */
  const getFullTyped = useCallback((): string => {
    const currentWord = session.words[session.currentIndex]
    if (!currentWord) return ''
    const wordLetters = currentWord.word.split('')
    const result: string[] = []
    let blankIdx = 0
    for (let i = 0; i < wordLetters.length; i++) {
      if (session.blanks.includes(i)) {
        result.push(session.typedLetters[blankIdx] || '')
        blankIdx++
      } else {
        result.push(wordLetters[i])
      }
    }
    return result.join('')
  }, [session])

  const reset = useCallback(
    (newWords?: WordEntry[]) => {
      cursorRef.current = null
      clearStorage()
      skipSave.current = true
      const w = newWords || words
      const blanks = w.length > 0 ? generateBlanks(w[0].word) : []
      const fresh: MissingLettersSessionState = {
        phase: 'typing',
        words: w,
        currentIndex: 0,
        typedLetters: [],
        blanks,
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
    getFullTyped,
    reset,
  }
}

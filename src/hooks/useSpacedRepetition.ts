import { useCallback } from 'react'
import { useApp } from '../context/AppContext'
import type { WordEntry, WordProgress } from '../types'
import {
  createWordProgress,
  updateProgress,
  selectWordsForSession,
} from '../utils/spacedRepetition'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function useSpacedRepetition(userId: string | null, listId: string) {
  const { state, dispatch } = useApp()

  const getProgressForWord = useCallback(
    (word: string): WordProgress => {
      if (userId) {
        const userKey = `${userId}:${listId}:${word}`
        if (state.progress[userKey]) return state.progress[userKey]
      }
      // Fall back to legacy key (no userId prefix)
      const legacyKey = `${listId}:${word}`
      return state.progress[legacyKey] || createWordProgress(word, listId)
    },
    [state.progress, userId, listId]
  )

  const recordResult = useCallback(
    (word: string, correct: boolean) => {
      const current = getProgressForWord(word)
      const updated = updateProgress(current, correct)
      dispatch({ type: 'UPDATE_PROGRESS', payload: updated, userId })
    },
    [getProgressForWord, dispatch, userId]
  )

  const getSessionWords = useCallback(
    (words: WordEntry[], count: number = 6): WordEntry[] => {
      const allProgress = words.map((w) => getProgressForWord(w.word))
      const selected = selectWordsForSession(allProgress, count)
      const result = selected
        .map((p) => words.find((w) => w.word === p.word))
        .filter((w): w is WordEntry => w !== undefined)
      return shuffle(result)
    },
    [getProgressForWord]
  )

  const getMissedSessionWords = useCallback(
    (words: WordEntry[], minCount: number): WordEntry[] => {
      const allProgress = words.map((w) => getProgressForWord(w.word))
      const missed = allProgress
        .filter((p) => p.incorrectCount > 0 && p.repetitions === 0)
        .sort((a, b) => b.incorrectCount - a.incorrectCount)

      // Include ALL missed words, only backfill if fewer than minCount
      const selected = [...missed]

      if (selected.length < minCount) {
        const missedWords = new Set(selected.map((p) => p.word))
        const remaining = allProgress.filter((p) => !missedWords.has(p.word))
        const backfill = selectWordsForSession(remaining, minCount - selected.length)
        selected.push(...backfill)
      }

      const result = selected
        .map((p) => words.find((w) => w.word === p.word))
        .filter((w): w is WordEntry => w !== undefined)
      return shuffle(result)
    },
    [getProgressForWord]
  )

  const getMostMissedSessionWords = useCallback(
    (words: WordEntry[], count: number): WordEntry[] => {
      const allProgress = words.map((w) => getProgressForWord(w.word))
      const everMissed = allProgress
        .filter((p) => p.incorrectCount > 0)
        .sort((a, b) => b.incorrectCount - a.incorrectCount)

      const selected = everMissed.slice(0, count)

      if (selected.length < count) {
        const usedWords = new Set(selected.map((p) => p.word))
        const remaining = allProgress.filter((p) => !usedWords.has(p.word))
        const backfill = selectWordsForSession(remaining, count - selected.length)
        selected.push(...backfill)
      }

      const result = selected
        .map((p) => words.find((w) => w.word === p.word))
        .filter((w): w is WordEntry => w !== undefined)
      return shuffle(result)
    },
    [getProgressForWord]
  )

  return { getProgressForWord, recordResult, getSessionWords, getMissedSessionWords, getMostMissedSessionWords }
}

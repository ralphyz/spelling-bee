import type { WordProgress } from '../types'

const MIN_EASE = 1.3
const INITIAL_EASE = 2.5

export function createWordProgress(word: string, listId: string): WordProgress {
  return {
    word,
    listId,
    correctCount: 0,
    incorrectCount: 0,
    lastReviewed: 0,
    nextReview: 0,
    easeFactor: INITIAL_EASE,
    interval: 0,
    repetitions: 0,
  }
}

export function updateProgress(
  progress: WordProgress,
  correct: boolean
): WordProgress {
  const now = Date.now()

  if (!correct) {
    return {
      ...progress,
      incorrectCount: progress.incorrectCount + 1,
      lastReviewed: now,
      nextReview: now + 60_000, // retry in 1 minute
      repetitions: 0,
      interval: 0,
      easeFactor: Math.max(MIN_EASE, progress.easeFactor - 0.2),
    }
  }

  const repetitions = progress.repetitions + 1
  let interval: number

  if (repetitions === 1) {
    interval = 1 // 1 minute
  } else if (repetitions === 2) {
    interval = 6 // 6 minutes
  } else {
    interval = Math.round(progress.interval * progress.easeFactor)
  }

  const easeFactor = Math.max(
    MIN_EASE,
    progress.easeFactor + 0.1 - 0.08 // slight increase for correct
  )

  return {
    ...progress,
    correctCount: progress.correctCount + 1,
    lastReviewed: now,
    nextReview: now + interval * 60_000,
    repetitions,
    interval,
    easeFactor,
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function selectWordsForSession(
  allProgress: WordProgress[],
  count: number
): WordProgress[] {
  // Untested/unpracticed words first (randomized)
  const untested = shuffleArray(
    allProgress.filter((p) => p.lastReviewed === 0)
  )

  // Then practiced words (randomized)
  const practiced = shuffleArray(
    allProgress.filter((p) => p.lastReviewed > 0)
  )

  // Combine: untested first, then practiced
  const pool = [...untested, ...practiced]

  return pool.slice(0, count)
}

export function getMasteryLevel(progress: WordProgress): number {
  if (progress.lastReviewed === 0) return 0
  if (progress.correctCount === 0) return 0
  const ratio = progress.correctCount / (progress.correctCount + progress.incorrectCount)
  const repBonus = Math.min(progress.repetitions / 5, 1)
  return Math.round(((ratio + repBonus) / 2) * 100)
}

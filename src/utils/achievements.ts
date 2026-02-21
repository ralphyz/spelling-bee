import type { SessionRecord, AppState, WordProgress } from '../types'

export interface AchievementDef {
  id: string
  emoji: string
  name: string
  description: string
  category: string
}

export const CATEGORIES: { id: string; label: string }[] = [
  { id: 'sessions', label: 'Sessions' },
  { id: 'words-correct', label: 'Words Correct' },
  { id: 'mastery', label: 'Mastery' },
  { id: 'lists-complete', label: 'Lists Complete' },
  { id: 'learning', label: 'Learning' },
  { id: 'quizzing', label: 'Quizzing' },
  { id: 'streaks', label: 'Streaks' },
  { id: 'practice-days', label: 'Practice Days' },
  { id: 'accuracy', label: 'Accuracy' },
  { id: 'special', label: 'Special' },
]

export const ACHIEVEMENTS: AchievementDef[] = [
  // Sessions (7)
  { id: 'first-steps', emoji: '🐣', name: 'First Steps', description: 'Complete your first session', category: 'sessions' },
  { id: 'high-five', emoji: '🖐️', name: 'High Five!', description: 'Complete 5 sessions', category: 'sessions' },
  { id: 'double-digits', emoji: '🔟', name: 'Double Digits', description: 'Complete 10 sessions', category: 'sessions' },
  { id: 'dedicated', emoji: '🎒', name: 'Dedicated', description: 'Complete 25 sessions', category: 'sessions' },
  { id: 'fifty-fabulous', emoji: '🏃', name: 'Fifty & Fabulous', description: 'Complete 50 sessions', category: 'sessions' },
  { id: 'century', emoji: '💯', name: 'Century', description: 'Complete 100 sessions', category: 'sessions' },
  { id: 'legendary', emoji: '👑', name: 'Legendary', description: 'Complete 250 sessions', category: 'sessions' },

  // Words Correct (6)
  { id: 'fifty-speller', emoji: '🎯', name: 'Fifty Speller', description: 'Spell 50 words correctly', category: 'words-correct' },
  { id: 'century-speller', emoji: '⭐', name: 'Century Speller', description: 'Spell 100 words correctly', category: 'words-correct' },
  { id: 'word-collector', emoji: '💎', name: 'Word Collector', description: 'Spell 250 words correctly', category: 'words-correct' },
  { id: 'word-flood', emoji: '🌊', name: 'Word Flood', description: 'Spell 500 words correctly', category: 'words-correct' },
  { id: 'word-mountain', emoji: '🏔️', name: 'Word Mountain', description: 'Spell 1,000 words correctly', category: 'words-correct' },
  { id: 'word-galaxy', emoji: '🌌', name: 'Word Galaxy', description: 'Spell 2,500 words correctly', category: 'words-correct' },

  // Mastery (6)
  { id: 'word-master', emoji: '🌟', name: 'Word Master', description: 'Master your first word', category: 'mastery' },
  { id: 'vocab-builder', emoji: '📖', name: 'Vocabulary Builder', description: 'Master 10 words', category: 'mastery' },
  { id: 'word-wizard', emoji: '🧠', name: 'Word Wizard', description: 'Master 25 words', category: 'mastery' },
  { id: 'vocab-scholar', emoji: '🎓', name: 'Vocab Scholar', description: 'Master 50 words', category: 'mastery' },
  { id: 'word-architect', emoji: '🏛️', name: 'Word Architect', description: 'Master 100 words', category: 'mastery' },
  { id: 'vocab-legend', emoji: '🏆', name: 'Vocab Legend', description: 'Master 250 words', category: 'mastery' },

  // Lists Complete (4)
  { id: 'list-complete', emoji: '✅', name: 'List Complete', description: 'Master every word in a list', category: 'lists-complete' },
  { id: 'list-crusher', emoji: '📋', name: 'List Crusher', description: 'Complete 3 lists', category: 'lists-complete' },
  { id: 'list-legend', emoji: '📚', name: 'List Legend', description: 'Complete 5 lists', category: 'lists-complete' },
  { id: 'collection-master', emoji: '🗂️', name: 'Collection Master', description: 'Complete 10 lists', category: 'lists-complete' },

  // Learning (4)
  { id: 'bookworm', emoji: '📚', name: 'Bookworm', description: 'Complete 10 learn sessions', category: 'learning' },
  { id: 'avid-reader', emoji: '📖', name: 'Avid Reader', description: 'Complete 25 learn sessions', category: 'learning' },
  { id: 'wise-owl', emoji: '🦉', name: 'Wise Owl', description: 'Complete 50 learn sessions', category: 'learning' },
  { id: 'grand-learner', emoji: '🧙', name: 'Grand Learner', description: 'Complete 100 learn sessions', category: 'learning' },

  // Quizzing (4)
  { id: 'quiz-whiz', emoji: '🐝', name: 'Quiz Whiz', description: 'Complete 10 quizzes', category: 'quizzing' },
  { id: 'quiz-pro', emoji: '🧪', name: 'Quiz Pro', description: 'Complete 25 quizzes', category: 'quizzing' },
  { id: 'quiz-master', emoji: '🎮', name: 'Quiz Master', description: 'Complete 50 quizzes', category: 'quizzing' },
  { id: 'quiz-legend', emoji: '🏆', name: 'Quiz Legend', description: 'Complete 100 quizzes', category: 'quizzing' },

  // Streaks (4)
  { id: 'on-fire', emoji: '🔥', name: 'On Fire!', description: '3 sessions in a row with 80%+', category: 'streaks' },
  { id: 'unstoppable', emoji: '💥', name: 'Unstoppable', description: '5 sessions in a row with 80%+', category: 'streaks' },
  { id: 'blazing', emoji: '☄️', name: 'Blazing', description: '10 sessions in a row with 80%+', category: 'streaks' },
  { id: 'inferno', emoji: '🌋', name: 'Inferno', description: '25 sessions in a row with 80%+', category: 'streaks' },

  // Practice Days (5)
  { id: 'regular', emoji: '📅', name: 'Regular', description: 'Practice on 5 different days', category: 'practice-days' },
  { id: 'week-warrior', emoji: '🗓️', name: 'Week Warrior', description: 'Practice on 7 different days', category: 'practice-days' },
  { id: 'monthly', emoji: '📆', name: 'Monthly', description: 'Practice on 30 different days', category: 'practice-days' },
  { id: 'semester-star', emoji: '🎗️', name: 'Semester Star', description: 'Practice on 90 different days', category: 'practice-days' },
  { id: 'year-round', emoji: '🏅', name: 'Year-Round', description: 'Practice on 180 different days', category: 'practice-days' },

  // Accuracy (4)
  { id: 'perfect-score', emoji: '💯', name: 'Perfect Score', description: 'Get 100% on any session', category: 'accuracy' },
  { id: 'perfectionist', emoji: '✨', name: 'Perfectionist', description: 'Get 100% on 5 sessions', category: 'accuracy' },
  { id: 'flawless', emoji: '🌠', name: 'Flawless', description: 'Get 100% on 10 sessions', category: 'accuracy' },
  { id: 'untouchable', emoji: '💫', name: 'Untouchable', description: 'Get 100% on 25 sessions', category: 'accuracy' },

  // Special (2)
  { id: 'quiz-champion', emoji: '🏆', name: 'Quiz Champion', description: 'Get 100% on a quiz', category: 'special' },
  { id: 'comeback-kid', emoji: '💪', name: 'Comeback Kid', description: 'Get 100% after a session below 50%', category: 'special' },

  // No Highlight (4)
  { id: 'no-training-wheels', emoji: '🛞', name: 'No Training Wheels', description: 'Complete 5 sessions without highlight', category: 'special' },
  { id: 'flying-solo', emoji: '🦅', name: 'Flying Solo', description: 'Complete 25 sessions without highlight', category: 'special' },
  { id: 'unassisted', emoji: '🎖️', name: 'Unassisted', description: 'Complete 50 sessions without highlight', category: 'special' },
  { id: 'true-speller', emoji: '👁️', name: 'True Speller', description: 'Complete 100 sessions without highlight', category: 'special' },
]

function findProgress(
  state: AppState,
  userId: string | null,
  listId: string,
  word: string,
): WordProgress | null {
  if (userId) {
    const userKey = `${userId}:${listId}:${word}`
    if (state.progress[userKey]) return state.progress[userKey]
  }
  const legacyKey = `${listId}:${word}`
  return state.progress[legacyKey] || null
}

function hasConsecutiveStreak(
  sessions: SessionRecord[],
  count: number,
  minScore: number,
): boolean {
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )
  let streak = 0
  for (const s of sorted) {
    if (s.score >= minScore) {
      streak++
      if (streak >= count) return true
    } else {
      streak = 0
    }
  }
  return false
}

function hasComeback(sessions: SessionRecord[]): boolean {
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )
  let hadBadSession = false
  for (const s of sorted) {
    if (s.score < 50) hadBadSession = true
    if (hadBadSession && s.score === 100) return true
  }
  return false
}

export function computeEarnedAchievementIds(
  sessions: SessionRecord[],
  state: AppState,
  userId: string | null,
): Set<string> {
  const earned = new Set<string>()

  // --- Sessions (1/5/10/25/50/100/250) ---
  const totalSessions = sessions.length
  if (totalSessions >= 1) earned.add('first-steps')
  if (totalSessions >= 5) earned.add('high-five')
  if (totalSessions >= 10) earned.add('double-digits')
  if (totalSessions >= 25) earned.add('dedicated')
  if (totalSessions >= 50) earned.add('fifty-fabulous')
  if (totalSessions >= 100) earned.add('century')
  if (totalSessions >= 250) earned.add('legendary')

  // --- Words Correct (50/100/250/500/1000/2500) ---
  const totalCorrect = sessions.reduce(
    (sum, s) => sum + s.results.filter((r) => r.correct).length,
    0,
  )
  if (totalCorrect >= 50) earned.add('fifty-speller')
  if (totalCorrect >= 100) earned.add('century-speller')
  if (totalCorrect >= 250) earned.add('word-collector')
  if (totalCorrect >= 500) earned.add('word-flood')
  if (totalCorrect >= 1000) earned.add('word-mountain')
  if (totalCorrect >= 2500) earned.add('word-galaxy')

  // --- Mastery (1/10/25/50/100/250) ---
  const mastery = (state.settings.heatmapLevels || 3) - 1
  let totalMastered = 0
  let completedLists = 0

  for (const list of state.wordLists) {
    let allMastered = list.words.length > 0
    for (const w of list.words) {
      const p = findProgress(state, userId, list.id, w.word)
      if (p && p.repetitions >= mastery) {
        totalMastered++
      } else {
        allMastered = false
      }
    }
    if (allMastered && list.words.length > 0) completedLists++
  }

  if (totalMastered >= 1) earned.add('word-master')
  if (totalMastered >= 10) earned.add('vocab-builder')
  if (totalMastered >= 25) earned.add('word-wizard')
  if (totalMastered >= 50) earned.add('vocab-scholar')
  if (totalMastered >= 100) earned.add('word-architect')
  if (totalMastered >= 250) earned.add('vocab-legend')

  // --- Lists Complete (1/3/5/10) ---
  if (completedLists >= 1) earned.add('list-complete')
  if (completedLists >= 3) earned.add('list-crusher')
  if (completedLists >= 5) earned.add('list-legend')
  if (completedLists >= 10) earned.add('collection-master')

  // --- Learning (10/25/50/100) ---
  const learnSessions = sessions.filter((s) => s.mode === 'learn').length
  if (learnSessions >= 10) earned.add('bookworm')
  if (learnSessions >= 25) earned.add('avid-reader')
  if (learnSessions >= 50) earned.add('wise-owl')
  if (learnSessions >= 100) earned.add('grand-learner')

  // --- Quizzing (10/25/50/100) ---
  const quizSessions = sessions.filter((s) => s.mode === 'quiz').length
  if (quizSessions >= 10) earned.add('quiz-whiz')
  if (quizSessions >= 25) earned.add('quiz-pro')
  if (quizSessions >= 50) earned.add('quiz-master')
  if (quizSessions >= 100) earned.add('quiz-legend')

  // --- Streaks (3/5/10/25) ---
  if (hasConsecutiveStreak(sessions, 3, 80)) earned.add('on-fire')
  if (hasConsecutiveStreak(sessions, 5, 80)) earned.add('unstoppable')
  if (hasConsecutiveStreak(sessions, 10, 80)) earned.add('blazing')
  if (hasConsecutiveStreak(sessions, 25, 80)) earned.add('inferno')

  // --- Practice Days (5/7/30/90/180) ---
  const uniqueDays = new Set(
    sessions.map((s) => new Date(s.date).toISOString().slice(0, 10)),
  )
  const dayCount = uniqueDays.size
  if (dayCount >= 5) earned.add('regular')
  if (dayCount >= 7) earned.add('week-warrior')
  if (dayCount >= 30) earned.add('monthly')
  if (dayCount >= 90) earned.add('semester-star')
  if (dayCount >= 180) earned.add('year-round')

  // --- Accuracy (1/5/10/25 perfect sessions) ---
  const perfectCount = sessions.filter((s) => s.score === 100).length
  if (perfectCount >= 1) earned.add('perfect-score')
  if (perfectCount >= 5) earned.add('perfectionist')
  if (perfectCount >= 10) earned.add('flawless')
  if (perfectCount >= 25) earned.add('untouchable')

  // --- Special ---
  if (sessions.some((s) => s.mode === 'quiz' && s.score === 100))
    earned.add('quiz-champion')
  if (hasComeback(sessions)) earned.add('comeback-kid')

  // --- No Highlight (5/25/50/100) ---
  const noHighlightCount = sessions.filter((s) => !s.highlightOn).length
  if (noHighlightCount >= 5) earned.add('no-training-wheels')
  if (noHighlightCount >= 25) earned.add('flying-solo')
  if (noHighlightCount >= 50) earned.add('unassisted')
  if (noHighlightCount >= 100) earned.add('true-speller')

  return earned
}

export function getNewlyEarnedAchievements(
  previousIds: Set<string>,
  currentIds: Set<string>,
): AchievementDef[] {
  return ACHIEVEMENTS.filter(
    (a) => currentIds.has(a.id) && !previousIds.has(a.id),
  )
}

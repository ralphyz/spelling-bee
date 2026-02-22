export interface UserProfile {
  id: string
  name: string
  avatar: string
  pin?: string
  theme?: string
  deprioritizedLists?: string[]
  listSortBy?: 'name' | 'date' | 'wordCount'
  listSortDir?: 'asc' | 'desc'
  keyboardScale?: number
  learnWordCount?: WordCountOption
  quizWordCount?: WordCountOption
  practiceWordCount?: WordCountOption
  missingLettersWordCount?: WordCountOption
  highlightModes?: { practice?: boolean; learn?: boolean; quiz?: boolean; missingLetters?: boolean }
  showArchived?: boolean
}

export type WordCountOption = 3 | 5 | 10 | 15 | 20 | 25 | 'all'

export type HeatmapLevels = 2 | 3 | 4 | 5

export interface AppSettings {
  learnWordCount: WordCountOption
  quizWordCount: WordCountOption
  heatmapLevels: HeatmapLevels
}

export interface SessionWordResult {
  word: string
  typed: string
  correct: boolean
}

export interface SessionRecord {
  id: string
  date: string
  listId: string
  listName: string
  mode: 'learn' | 'quiz' | 'practice' | 'missingLetters' | 'highlight'
  results: SessionWordResult[]
  score: number
  userId?: string
  highlightOn?: boolean
}

export interface WordEntry {
  word: string
  definition: string
  partOfSpeech: string
  example: string
  audioUrl: string | null
  phonetic: string
}

export interface WordList {
  id: string
  name: string
  words: WordEntry[]
  createdAt: number
  updatedAt: number
  requirePractice?: boolean
  pin?: string
}

export interface WordProgress {
  word: string
  listId: string
  correctCount: number
  incorrectCount: number
  lastReviewed: number
  nextReview: number
  easeFactor: number
  interval: number
  repetitions: number
}

export interface AppState {
  wordLists: WordList[]
  progress: Record<string, WordProgress>
  activeListId: string | null
  settings: AppSettings
  users: UserProfile[]
  currentUserId: string | null
  authenticatedPin: string | null
  authenticatedUserIds: string[]
  isAdmin: boolean
}

export type AppAction =
  | { type: 'ADD_LIST'; payload: WordList }
  | { type: 'UPDATE_LIST'; payload: WordList }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'SET_ACTIVE_LIST'; payload: string | null }
  | { type: 'UPDATE_PROGRESS'; payload: WordProgress; userId?: string | null }
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'ADD_USER'; payload: UserProfile }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'SET_CURRENT_USER'; payload: string | null }
  | { type: 'SET_USER_THEME'; payload: { userId: string; theme: string } }
  | { type: 'SET_USER_AVATAR'; payload: { userId: string; avatar: string } }
  | { type: 'SET_USER_NAME'; payload: { userId: string; name: string } }
  | { type: 'CLEAR_USER_PROGRESS'; payload: string }
  | { type: 'TOGGLE_LIST_PRIORITY'; payload: { userId: string; listId: string } }
  | { type: 'SET_LIST_SORT'; payload: { userId: string; sortBy: 'name' | 'date' | 'wordCount'; sortDir: 'asc' | 'desc' } }
  | { type: 'SET_KEYBOARD_SCALE'; payload: { userId: string; scale: number } }
  | { type: 'SET_WORD_COUNTS'; payload: { userId: string; learnWordCount?: WordCountOption; quizWordCount?: WordCountOption; practiceWordCount?: WordCountOption; missingLettersWordCount?: WordCountOption } }
  | { type: 'TOGGLE_HIGHLIGHT_MODE'; payload: { userId: string; activity: 'practice' | 'learn' | 'quiz' | 'missingLetters' } }
  | { type: 'TOGGLE_SHOW_ARCHIVED'; payload: { userId: string } }
  | { type: 'SET_AUTH'; payload: { pin: string; userIds: string[]; isAdmin: boolean; sessionVersion?: number } }
  | { type: 'CLEAR_AUTH' }

export type LearnPhase = 'study' | 'practice' | 'feedback' | 'done'

export interface LearnSessionState {
  phase: LearnPhase
  words: WordEntry[]
  currentIndex: number
  typedLetters: string[]
  isCorrect: boolean | null
  results: SessionWordResult[]
  listId: string
}

export type PracticePhase = 'typing' | 'done'

export interface PracticeSessionState {
  phase: PracticePhase
  words: WordEntry[]
  currentIndex: number
  typedLetters: string[]
  results: SessionWordResult[]
  listId: string
}

export type MissingLettersPhase = 'typing' | 'done'

export interface MissingLettersSessionState {
  phase: MissingLettersPhase
  words: WordEntry[]
  currentIndex: number
  typedLetters: string[]
  blanks: number[]
  results: SessionWordResult[]
  listId: string
}

export type QuizPhase = 'prompt' | 'spelling' | 'result' | 'summary'

export interface QuizResult {
  word: string
  typed: string
  correct: boolean
}

export interface QuizSessionState {
  phase: QuizPhase
  words: WordEntry[]
  currentIndex: number
  typedLetters: string[]
  results: QuizResult[]
}

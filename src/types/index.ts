export interface UserProfile {
  id: string
  name: string
  avatar: string
  theme?: string
  deprioritizedLists?: string[]
  listSortBy?: 'name' | 'date' | 'wordCount'
  listSortDir?: 'asc' | 'desc'
}

export type WordCountOption = 5 | 10 | 15 | 20 | 25 | 'all'

export type HeatmapLevels = 2 | 3 | 4 | 5

export interface AppSettings {
  learnWordCount: WordCountOption
  quizWordCount: WordCountOption
  heatmapLevels: HeatmapLevels
  keyboardScale?: number
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
  mode: 'learn' | 'quiz'
  results: SessionWordResult[]
  score: number
  userId?: string
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

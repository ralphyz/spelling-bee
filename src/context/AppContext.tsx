import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import type { AppState, AppAction, AppSettings, SessionRecord, WordList } from '../types'
import { applyTheme, DEFAULT_THEME } from '../utils/themes'

export function filterVisibleLists(wordLists: WordList[], state: AppState): WordList[] {
  if (state.isAdmin) return wordLists
  return wordLists.filter((l) => !l.pin || l.pin === state.authenticatedPin)
}

const defaultSettings: AppSettings = {
  learnWordCount: 5,
  quizWordCount: 5,
  heatmapLevels: 3,
}

const AUTH_STORAGE_KEY = 'spelling-bee-auth'
const AUTH_TTL_MS = 48 * 60 * 60 * 1000 // 48 hours

interface StoredAuth {
  pin: string
  userIds: string[]
  isAdmin: boolean
  timestamp: number
  sessionVersion?: number
}

function getStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const auth = JSON.parse(raw) as StoredAuth
    if (Date.now() - auth.timestamp > AUTH_TTL_MS) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }
    return auth
  } catch { return null }
}

function setStoredAuth(pin: string, userIds: string[], isAdmin: boolean, sessionVersion?: number) {
  try {
    const auth: StoredAuth = { pin, userIds, isAdmin, timestamp: Date.now(), sessionVersion }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
  } catch { /* ignore */ }
}

function clearStoredAuth() {
  try { localStorage.removeItem(AUTH_STORAGE_KEY) } catch { /* ignore */ }
}

function getLocalUserId(): string | null {
  try {
    return localStorage.getItem('spelling-bee-current-user') || null
  } catch { return null }
}

function setLocalUserId(userId: string | null) {
  try {
    if (userId) localStorage.setItem('spelling-bee-current-user', userId)
    else localStorage.removeItem('spelling-bee-current-user')
  } catch { /* ignore */ }
}

const storedAuth = getStoredAuth()
// Refresh the 48-hour window on every app load
if (storedAuth) {
  setStoredAuth(storedAuth.pin, storedAuth.userIds, storedAuth.isAdmin)
}

const initialState: AppState = {
  wordLists: [],
  progress: {},
  activeListId: null,
  settings: defaultSettings,
  users: [],
  currentUserId: getLocalUserId(),
  authenticatedPin: storedAuth?.pin ?? null,
  authenticatedUserIds: storedAuth?.userIds ?? [],
  isAdmin: storedAuth?.isAdmin ?? false,
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_LIST':
      return { ...state, wordLists: [...state.wordLists, action.payload] }

    case 'UPDATE_LIST':
      return {
        ...state,
        wordLists: state.wordLists.map((l) =>
          l.id === action.payload.id ? action.payload : l
        ),
      }

    case 'DELETE_LIST': {
      const newProgress = { ...state.progress }
      for (const key of Object.keys(newProgress)) {
        if (newProgress[key].listId === action.payload) {
          delete newProgress[key]
        }
      }
      return {
        ...state,
        wordLists: state.wordLists.filter((l) => l.id !== action.payload),
        activeListId:
          state.activeListId === action.payload ? null : state.activeListId,
        progress: newProgress,
      }
    }

    case 'SET_ACTIVE_LIST':
      return { ...state, activeListId: action.payload }

    case 'UPDATE_PROGRESS': {
      const key = action.userId
        ? `${action.userId}:${action.payload.listId}:${action.payload.word}`
        : `${action.payload.listId}:${action.payload.word}`
      return {
        ...state,
        progress: { ...state.progress, [key]: action.payload },
      }
    }

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      }

    case 'ADD_USER':
      return {
        ...state,
        users: [...state.users, action.payload],
      }

    case 'DELETE_USER': {
      const userId = action.payload
      if (state.currentUserId === userId) setLocalUserId(null)
      const newProgress = { ...state.progress }
      for (const key of Object.keys(newProgress)) {
        if (key.startsWith(`${userId}:`)) {
          delete newProgress[key]
        }
      }
      return {
        ...state,
        users: state.users.filter((u) => u.id !== userId),
        currentUserId: state.currentUserId === userId ? null : state.currentUserId,
        progress: newProgress,
      }
    }

    case 'SET_CURRENT_USER':
      setLocalUserId(action.payload)
      return { ...state, currentUserId: action.payload }

    case 'SET_USER_THEME':
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.payload.userId
            ? { ...u, theme: action.payload.theme }
            : u
        ),
      }

    case 'SET_USER_AVATAR':
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.payload.userId
            ? { ...u, avatar: action.payload.avatar }
            : u
        ),
      }

    case 'SET_USER_NAME':
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.payload.userId
            ? { ...u, name: action.payload.name }
            : u
        ),
      }

    case 'CLEAR_USER_PROGRESS': {
      const userId = action.payload
      const newProgress = { ...state.progress }
      for (const key of Object.keys(newProgress)) {
        if (key.startsWith(`${userId}:`)) {
          delete newProgress[key]
        }
      }
      // Also clear legacy keys (no userId prefix) for this user
      for (const list of state.wordLists) {
        for (const w of list.words) {
          const legacyKey = `${list.id}:${w.word}`
          if (newProgress[legacyKey]) {
            delete newProgress[legacyKey]
          }
        }
      }
      return { ...state, progress: newProgress }
    }

    case 'TOGGLE_LIST_PRIORITY': {
      const { userId, listId } = action.payload
      return {
        ...state,
        users: state.users.map((u) => {
          if (u.id !== userId) return u
          const list = u.deprioritizedLists || []
          const has = list.includes(listId)
          return {
            ...u,
            deprioritizedLists: has
              ? list.filter((id) => id !== listId)
              : [...list, listId],
          }
        }),
      }
    }

    case 'TOGGLE_SHOW_ARCHIVED': {
      const { userId } = action.payload
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === userId
            ? { ...u, showArchived: !u.showArchived }
            : u
        ),
      }
    }

    case 'SET_LIST_SORT': {
      const { userId, sortBy, sortDir } = action.payload
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === userId
            ? { ...u, listSortBy: sortBy, listSortDir: sortDir }
            : u
        ),
      }
    }

    case 'SET_KEYBOARD_SCALE': {
      const { userId, scale } = action.payload
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === userId ? { ...u, keyboardScale: scale } : u
        ),
      }
    }

    case 'SET_WORD_COUNTS': {
      const { userId, learnWordCount, quizWordCount, practiceWordCount, missingLettersWordCount } = action.payload
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === userId
            ? {
                ...u,
                ...(learnWordCount !== undefined && { learnWordCount }),
                ...(quizWordCount !== undefined && { quizWordCount }),
                ...(practiceWordCount !== undefined && { practiceWordCount }),
                ...(missingLettersWordCount !== undefined && { missingLettersWordCount }),
              }
            : u
        ),
      }
    }

    case 'TOGGLE_HIGHLIGHT_MODE': {
      const { userId, activity } = action.payload
      return {
        ...state,
        users: state.users.map((u) => {
          if (u.id !== userId) return u
          const modes = { ...u.highlightModes }
          modes[activity] = !modes[activity]
          return { ...u, highlightModes: modes }
        }),
      }
    }

    case 'SET_AUTH': {
      const { pin, userIds, isAdmin, sessionVersion } = action.payload
      setStoredAuth(pin, userIds, isAdmin, sessionVersion)
      return {
        ...state,
        authenticatedPin: pin,
        authenticatedUserIds: userIds,
        isAdmin,
      }
    }

    case 'CLEAR_AUTH':
      setLocalUserId(null)
      clearStoredAuth()
      return {
        ...state,
        authenticatedPin: null,
        authenticatedUserIds: [],
        isAdmin: false,
        currentUserId: null,
      }

    case 'LOAD_STATE':
      return {
        ...action.payload,
        settings: action.payload.settings || defaultSettings,
        users: action.payload.users || [],
        currentUserId: getLocalUserId(),
        authenticatedPin: state.authenticatedPin,
        authenticatedUserIds: state.authenticatedUserIds,
        isAdmin: state.isAdmin,
      }

    default:
      return state
  }
}

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

const AppContext = createContext<AppContextValue | null>(null)

async function fetchState(): Promise<AppState | null> {
  try {
    const res = await fetch('/api/state')
    if (res.ok) return (await res.json()) as AppState
  } catch {
    // server not available
  }
  return null
}

async function pushState(state: AppState) {
  try {
    await fetch('/api/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    })
  } catch {
    // ignore
  }
}

export async function saveSession(record: SessionRecord) {
  try {
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    })
  } catch {
    // ignore
  }
}

export async function clearSessions(userId?: string) {
  try {
    const params = new URLSearchParams()
    if (userId) params.set('userId', userId)
    const qs = params.toString()
    const url = qs ? `/api/sessions?${qs}` : '/api/sessions'
    await fetch(url, { method: 'DELETE' })
  } catch {
    // ignore
  }
}

export async function fetchSessions(opts?: { listId?: string; userId?: string }): Promise<SessionRecord[]> {
  try {
    const params = new URLSearchParams()
    if (opts?.listId) params.set('listId', opts.listId)
    if (opts?.userId) params.set('userId', opts.userId)
    const qs = params.toString()
    const url = qs ? `/api/sessions?${qs}` : '/api/sessions'
    const res = await fetch(url)
    if (res.ok) return (await res.json()) as SessionRecord[]
  } catch {
    // server not available
  }
  return []
}

export async function verifyPin(pin: string): Promise<{ userIds: string[]; isAdmin: boolean; sessionVersion?: number } | { error: string; retryAfter?: number; cooldown?: number }> {
  try {
    const res = await fetch('/api/auth/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    return await res.json()
  } catch {
    return { error: 'network' }
  }
}

export async function setUserPin(userId: string, pin: string, adminPin: string): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/set-pin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, pin, adminPin }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function changeAdminPin(currentPin: string, newPin: string): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/change-admin-pin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPin, newPin }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function invalidateSessions(adminPinValue: string): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/invalidate-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPin: adminPinValue }),
    })
    return res.ok
  } catch {
    return false
  }
}

async function checkSessionVersion(): Promise<number | null> {
  try {
    const res = await fetch('/api/auth/session-version')
    if (res.ok) {
      const data = await res.json()
      return data.sessionVersion
    }
  } catch { /* ignore */ }
  return null
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const initialized = useRef(false)
  const skipSync = useRef(false)
  const serverHadData = useRef(false)

  // Load state from server on mount + validate session version
  useEffect(() => {
    fetchState().then((loaded) => {
      if (loaded && loaded.wordLists.length > 0) {
        serverHadData.current = true
        skipSync.current = true
        dispatch({ type: 'LOAD_STATE', payload: loaded })
      }
      initialized.current = true
    })
    // Check if stored session is still valid
    const auth = getStoredAuth()
    if (auth?.sessionVersion) {
      checkSessionVersion().then((serverVersion) => {
        if (serverVersion && serverVersion !== auth.sessionVersion) {
          clearStoredAuth()
          setLocalUserId(null)
          dispatch({ type: 'CLEAR_AUTH' })
        }
      })
    }
  }, [])

  // Push state to server on changes (after initial load)
  useEffect(() => {
    if (!initialized.current) return
    if (skipSync.current) {
      skipSync.current = false
      return
    }
    // Safety: never overwrite server data with empty state
    if (serverHadData.current && state.wordLists.length === 0) return
    pushState(state)
  }, [state])

  // Apply theme when current user changes
  useEffect(() => {
    const user = state.users.find((u) => u.id === state.currentUserId)
    applyTheme(user?.theme || DEFAULT_THEME)
  }, [state.currentUserId, state.users])

  // Poll for updates from server every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      // Check session validity
      if (state.authenticatedPin) {
        const auth = getStoredAuth()
        if (auth?.sessionVersion) {
          const serverVersion = await checkSessionVersion()
          if (serverVersion && serverVersion !== auth.sessionVersion) {
            clearStoredAuth()
            setLocalUserId(null)
            dispatch({ type: 'CLEAR_AUTH' })
            return
          }
        }
      }

      const remote = await fetchState()
      if (!remote) return
      // Only update if server has different word lists or users
      if (
        JSON.stringify(remote.wordLists) !== JSON.stringify(state.wordLists) ||
        JSON.stringify(remote.users) !== JSON.stringify(state.users)
      ) {
        skipSync.current = true
        dispatch({ type: 'LOAD_STATE', payload: remote })
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [state.wordLists, state.users, state.authenticatedPin])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

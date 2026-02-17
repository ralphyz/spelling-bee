import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import type { AppState, AppAction, AppSettings, SessionRecord } from '../types'
import { applyTheme, DEFAULT_THEME } from '../utils/themes'

const defaultSettings: AppSettings = {
  learnWordCount: 5,
  quizWordCount: 5,
  heatmapLevels: 3,
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

const initialState: AppState = {
  wordLists: [],
  progress: {},
  activeListId: null,
  settings: defaultSettings,
  users: [],
  currentUserId: getLocalUserId(),
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

    case 'LOAD_STATE':
      return {
        ...action.payload,
        settings: action.payload.settings || defaultSettings,
        users: action.payload.users || [],
        currentUserId: getLocalUserId() ?? action.payload.currentUserId ?? null,
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const initialized = useRef(false)
  const skipSync = useRef(false)

  // Load state from server on mount
  useEffect(() => {
    fetchState().then((loaded) => {
      if (loaded && loaded.wordLists.length > 0) {
        skipSync.current = true
        dispatch({ type: 'LOAD_STATE', payload: loaded })
      }
      initialized.current = true
    })
  }, [])

  // Push state to server on changes (after initial load)
  useEffect(() => {
    if (!initialized.current) return
    if (skipSync.current) {
      skipSync.current = false
      return
    }
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
  }, [state.wordLists, state.users])

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

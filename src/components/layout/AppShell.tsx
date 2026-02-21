import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { BottomNav } from './BottomNav'
import { UserSwitcher } from '../shared/UserSwitcher'
import { useApp } from '../../context/AppContext'

// Webkit-prefixed fullscreen helpers for iPad/Safari
const doc = document as Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void>
  webkitFullscreenEnabled?: boolean
}
const root = document.documentElement as HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>
}

// iOS (iPhone/iPad) doesn't support fullscreen API for web content
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

const fullscreenSupported = !isIOS && (
  document.fullscreenEnabled ||
  doc.webkitFullscreenEnabled ||
  !!root.requestFullscreen ||
  !!root.webkitRequestFullscreen
)

function getFullscreenElement() {
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null
}

async function requestFullscreen() {
  if (root.requestFullscreen) return root.requestFullscreen()
  if (root.webkitRequestFullscreen) return root.webkitRequestFullscreen()
  throw new Error('Fullscreen API not available')
}

async function exitFullscreen() {
  if (document.exitFullscreen) return document.exitFullscreen()
  if (doc.webkitExitFullscreen) return doc.webkitExitFullscreen()
  throw new Error('Fullscreen exit not available')
}

const titles: Record<string, string> = {
  '/': 'Spelling Bee',
  '/parent': 'Word Lists',
  '/practice': 'Practice',
  '/learn': 'Learn',
  '/quiz': 'Quiz',
  '/progress': 'Progress',
  '/options': 'Settings',
  '/profile': 'Profile',
  '/missing-letters': 'Missing Letters',
}

export function AppShell() {
  const { state } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const title = titles[location.pathname] || 'Spelling Bee'
  const currentUser = state.users.find((u) => u.id === state.currentUserId)
  const isHome = location.pathname === '/'
  const isInSession = location.pathname === '/quiz'
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(!!getFullscreenElement())
  const [fsError, setFsError] = useState<string | null>(null)

  useEffect(() => {
    const handler = () => setIsFullscreen(!!getFullscreenElement())
    document.addEventListener('fullscreenchange', handler)
    document.addEventListener('webkitfullscreenchange', handler)
    return () => {
      document.removeEventListener('fullscreenchange', handler)
      document.removeEventListener('webkitfullscreenchange', handler)
    }
  }, [])

  // Auto-dismiss error toast
  useEffect(() => {
    if (!fsError) return
    const t = setTimeout(() => setFsError(null), 4000)
    return () => clearTimeout(t)
  }, [fsError])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (getFullscreenElement()) {
        await exitFullscreen()
      } else {
        await requestFullscreen()
      }
    } catch (err) {
      setFsError(err instanceof Error ? err.message : 'Fullscreen not supported on this device')
    }
  }, [])

  const handleHeaderNav = (to: string) => {
    if (location.pathname === to) return
    if (isInSession) {
      setConfirmTarget(to)
    } else {
      navigate(to)
    }
  }

  return (
    <div className="flex flex-col h-full bg-base-100">
      <header className="sticky top-0 z-30 flex items-center gap-1 px-2 h-20 bg-base-100/80 backdrop-blur-xl border-b border-base-content/5">
        {!isHome ? (
          <button
            onClick={() => handleHeaderNav('/')}
            className="btn btn-ghost rounded-xl gap-0 pl-1 pr-3"
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>
        ) : (
          <div className="w-10" />
        )}

        <h1 className="text-xl font-bold flex-1 text-center truncate">{title}</h1>

        <div className="flex items-center gap-1">
          {currentUser && (
            <span className="text-sm font-semibold text-base-content/70 truncate max-w-[72px]">
              {currentUser.name}
            </span>
          )}
          <UserSwitcher />
          {fullscreenSupported && (
            <button
              onClick={toggleFullscreen}
              className="btn btn-ghost btn-circle"
              title={isFullscreen ? 'Exit full screen' : 'Full screen'}
            >
              {isFullscreen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              )}
            </button>
          )}
          <button
            onClick={() => handleHeaderNav('/options')}
            className={`btn btn-ghost btn-circle ${
              location.pathname === '/options' ? 'text-primary' : ''
            }`}
          >
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-28">
        <Outlet />
      </main>
      <BottomNav />

      {fsError && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-error text-white px-4 py-2 rounded-xl shadow-lg text-sm font-medium max-w-xs text-center">
          {fsError}
        </div>
      )}

      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-base-100 rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl text-center space-y-4 border border-base-content/5">
            <p className="text-lg font-bold">Leave this session?</p>
            <p className="text-base-content/60 text-sm">
              Your current progress won't be saved.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                className="btn btn-ghost rounded-xl flex-1"
                onClick={() => setConfirmTarget(null)}
              >
                Stay
              </button>
              <button
                className="btn btn-error rounded-xl flex-1 text-white"
                onClick={() => {
                  const target = confirmTarget
                  setConfirmTarget(null)
                  navigate(target)
                }}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

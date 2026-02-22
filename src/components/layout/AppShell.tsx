import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { BottomNav } from './BottomNav'
import { UserGate } from './UserGate'
import { UserSwitcher } from '../shared/UserSwitcher'
import { useApp } from '../../context/AppContext'

const titles: Record<string, { label: string; prefix?: string }> = {
  '/': { label: "RalphyZ's Spelling Bee" },
  '/parent': { label: 'Word Lists', prefix: '⬡' },
  '/practice': { label: 'Practice', prefix: '⬡' },
  '/learn': { label: 'Learn', prefix: '⬡' },
  '/quiz': { label: 'Quiz', prefix: '⬡' },
  '/progress': { label: 'Progress', prefix: '⬡' },
  '/report': { label: 'Report', prefix: '⬡' },
  '/options': { label: 'Settings', prefix: '⬡' },
  '/profile': { label: 'Profile', prefix: '⬡' },
  '/missing-letters': { label: 'Missing Letters', prefix: '⬡' },
}

export function AppShell() {
  const { state } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const titleInfo = titles[location.pathname] || { label: "RalphyZ's Spelling Bee" }
  const isHome = location.pathname === '/'
  const isInSession = location.pathname === '/quiz'
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null)

  const handleHeaderNav = (to: string) => {
    if (location.pathname === to) return
    if (isInSession) {
      setConfirmTarget(to)
    } else {
      navigate(to)
    }
  }

  // Show UserGate when not authenticated or no user selected
  const showUserGate = !state.authenticatedPin || !state.currentUserId

  return (
    <div className="flex flex-col h-full bg-base-100">
      <header className="sticky top-0 z-30 flex items-center gap-2 px-2 h-14 bg-base-100/80 backdrop-blur-xl border-b border-base-content/5">
        {/* Left: Bee home/back button */}
        <button
          onClick={() => handleHeaderNav('/')}
          className="btn btn-ghost btn-sm rounded-xl gap-0.5 px-2 shrink-0"
        >
          {!isHome && (
            <span className="text-base-content/40 text-sm mr-0.5">&lsaquo;</span>
          )}
          <motion.span
            animate={{ y: [0, -2, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="text-xl leading-none"
          >
            🐝
          </motion.span>
        </button>

        {/* Center: Branded title */}
        <div className="flex-1 text-center min-w-0">
          <AnimatePresence mode="wait">
            <motion.h1
              key={location.pathname}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="text-lg font-bold truncate"
            >
              {isHome ? (
                <span className="text-primary">RalphyZ's Spelling Bee</span>
              ) : (
                <>
                  {titleInfo.prefix && (
                    <span className="text-primary/40 mr-1">{titleInfo.prefix}</span>
                  )}
                  {titleInfo.label}
                </>
              )}
            </motion.h1>
          </AnimatePresence>
        </div>

        {/* Right: User avatar only */}
        <div className="shrink-0">
          <UserSwitcher />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-28 honeycomb-bg">
        {showUserGate ? <UserGate /> : <Outlet />}
      </main>
      <BottomNav />

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

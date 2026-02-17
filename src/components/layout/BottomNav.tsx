import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const navItems = [
  {
    to: '/progress',
    label: 'Progress',
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
  {
    to: '/report',
    label: 'Report',
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
      </svg>
    ),
  },
  {
    to: '/parent',
    label: 'Lists',
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
      </svg>
    ),
  },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null)

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname === to

  const isInQuiz = location.pathname === '/quiz'

  const handleNav = (to: string) => {
    if (isActive(to)) return
    if (isInQuiz) {
      setConfirmTarget(to)
    } else {
      navigate(to)
    }
  }

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch bg-base-100/80 backdrop-blur-xl border-t border-base-content/5 h-20"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {navItems.map((item) => {
          const active = isActive(item.to)
          return (
            <button
              key={item.to}
              onClick={() => handleNav(item.to)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1"
            >
              <div
                className={`flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-2xl transition-all ${
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'text-base-content/50 hover:bg-base-content/8 hover:text-base-content/70 active:bg-base-content/10 active:text-base-content/80'
                }`}
              >
                {item.icon}
                <span className={`text-sm leading-none tracking-wide ${active ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </div>
            </button>
          )
        })}
      </nav>

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
    </>
  )
}

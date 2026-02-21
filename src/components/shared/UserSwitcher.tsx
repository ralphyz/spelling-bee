import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { AVATARS, getAvatarSrc, DEFAULT_AVATAR } from '../../utils/themes'
import { uuid } from '../../utils/uuid'

export function UserSwitcher() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR)
  const ref = useRef<HTMLDivElement>(null)

  const currentUser = state.users.find((u) => u.id === state.currentUserId)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setAdding(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleAdd = () => {
    if (!name.trim()) return
    const id = uuid()
    dispatch({ type: 'ADD_USER', payload: { id, name: name.trim(), avatar } })
    dispatch({ type: 'SET_CURRENT_USER', payload: id })
    setName('')
    setAvatar(DEFAULT_AVATAR)
    setAdding(false)
    setOpen(false)
  }

  const avatarSrc = currentUser ? getAvatarSrc(currentUser.avatar) : null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="btn btn-ghost rounded-full w-16 h-16 min-h-0 p-0"
      >
        {avatarSrc ? (
          <img src={avatarSrc} alt="" className="w-14 h-14 rounded-full object-cover" />
        ) : currentUser ? (
          <span className="text-4xl leading-none">{currentUser.avatar}</span>
        ) : (
          <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-base-200 rounded-2xl shadow-2xl border border-base-content/5 z-50 w-64 overflow-hidden">
          {!adding ? (
            <>
              {state.users.length > 0 && (
                <div className="px-3 pt-3 pb-1">
                  <p className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">Users</p>
                </div>
              )}
              {state.users.map((u) => {
                const src = getAvatarSrc(u.avatar)
                return (
                  <button
                    key={u.id}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 hover:bg-base-300/50 active:bg-base-300 transition-colors ${
                      u.id === state.currentUserId ? 'bg-primary/10' : ''
                    }`}
                    onClick={() => {
                      dispatch({ type: 'SET_CURRENT_USER', payload: u.id })
                      setOpen(false)
                    }}
                  >
                    {src ? (
                      <img src={src} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <span className="text-3xl leading-none">{u.avatar}</span>
                    )}
                    <span className="font-semibold text-base text-base-content truncate flex-1">{u.name}</span>
                    <div className="flex items-center gap-1 w-14 shrink-0 justify-end">
                      {u.id === state.currentUserId && (
                        <>
                          <button
                            className="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-base-content/70"
                            title="Edit profile"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpen(false)
                              navigate('/profile')
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
                            </svg>
                          </button>
                          <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        </>
                      )}
                    </div>
                  </button>
                )
              })}
              <button
                className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-base-300/50 active:bg-base-300 transition-colors border-t border-base-content/5"
                onClick={() => setAdding(true)}
              >
                <svg className="w-8 h-8 ml-0.5 text-base-content/60" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                </svg>
                <span className="text-base text-base-content/60">Add new user</span>
              </button>
            </>
          ) : (
            <div className="p-4 space-y-3">
              <p className="font-bold text-sm text-base-content">New User</p>
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input input-bordered input-sm w-full rounded-xl"
                maxLength={20}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto">
                {AVATARS.map((a) => (
                  <button
                    key={a.id}
                    className={`p-1 rounded-xl transition-all ${
                      a.id === avatar
                        ? 'bg-primary/20 ring-2 ring-primary scale-110'
                        : 'hover:bg-base-300/50'
                    }`}
                    onClick={() => setAvatar(a.id)}
                  >
                    <img src={a.src} alt={a.label} className="w-10 h-10 rounded-lg object-cover" />
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-ghost btn-sm flex-1 rounded-xl"
                  onClick={() => setAdding(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-sm flex-1 rounded-xl"
                  onClick={handleAdd}
                  disabled={!name.trim()}
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

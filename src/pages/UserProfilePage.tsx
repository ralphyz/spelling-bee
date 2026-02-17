import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useApp, clearSessions } from '../context/AppContext'
import { THEMES, AVATARS, DEFAULT_THEME, applyTheme, getAvatarSrc } from '../utils/themes'

function generateMathChallenge() {
  const a = Math.floor(Math.random() * 20) + 1
  const b = Math.floor(Math.random() * 20) + 1
  return { question: `What is ${a} + ${b}?`, answer: a + b }
}

function ThemeSwatch({ themeId }: { themeId: string }) {
  return (
    <div data-theme={themeId} className="flex gap-1">
      <div className="w-3 h-3 rounded-full bg-primary" />
      <div className="w-3 h-3 rounded-full bg-secondary" />
      <div className="w-3 h-3 rounded-full bg-accent" />
    </div>
  )
}

function MathConfirmCard({
  title,
  description,
  buttonLabel,
  color,
  onConfirm,
  onCancel,
}: {
  title: string
  description: string
  buttonLabel: string
  color: 'error' | 'warning'
  onConfirm: () => void
  onCancel: () => void
}) {
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState(false)
  const challenge = useMemo(() => generateMathChallenge(), [])

  const handleSubmit = () => {
    if (parseInt(answer, 10) === challenge.answer) {
      onConfirm()
    } else {
      setError(true)
      setAnswer('')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card bg-${color}/10 border border-${color}/20`}
    >
      <div className="card-body gap-3">
        <p className={`font-bold text-${color}`}>{title}</p>
        <p className="text-sm text-base-content/60">{description}</p>
        <p className="text-lg font-bold text-center">{challenge.question}</p>
        <input
          type="number"
          inputMode="numeric"
          placeholder="Your answer"
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value)
            setError(false)
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className={`input input-bordered w-full rounded-xl ${error ? 'input-error' : ''}`}
          autoFocus
        />
        {error && (
          <p className="text-error text-sm">That's not right. Try again!</p>
        )}
        <div className="flex gap-2">
          <button
            className="btn btn-ghost flex-1 rounded-xl"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className={`btn btn-${color} flex-1 rounded-xl text-white`}
            onClick={handleSubmit}
            disabled={!answer}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export function UserProfilePage() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const [showDelete, setShowDelete] = useState(false)
  const [showClear, setShowClear] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')

  const currentUser = state.users.find((u) => u.id === state.currentUserId)

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <svg className="w-12 h-12 text-base-content/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
        <p className="text-base-content/60">No user selected.</p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="btn btn-primary rounded-2xl"
          onClick={() => navigate('/')}
        >
          Go Home
        </motion.button>
      </div>
    )
  }

  const currentTheme = currentUser.theme || DEFAULT_THEME
  const avatarSrc = getAvatarSrc(currentUser.avatar)

  const handleThemeChange = (themeId: string) => {
    dispatch({ type: 'SET_USER_THEME', payload: { userId: currentUser.id, theme: themeId } })
    applyTheme(themeId)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-base-200 border border-base-content/5"
      >
        <div className="card-body items-center text-center gap-4">
          <button
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            className="relative group"
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt="" className="w-20 h-20 rounded-2xl object-cover transition-transform group-active:scale-90" />
            ) : (
              <span className="text-6xl block transition-transform group-active:scale-90">{currentUser.avatar}</span>
            )}
            <span className="absolute -bottom-1 -right-1 bg-base-300 rounded-full w-6 h-6 flex items-center justify-center border-2 border-base-200">
              <svg className="w-3 h-3 text-base-content/60" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
              </svg>
            </span>
          </button>
          {showAvatarPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-5 gap-2 w-full"
            >
              {AVATARS.map((a) => (
                <button
                  key={a.id}
                  className={`p-1.5 rounded-xl transition-all ${
                    a.id === currentUser.avatar
                      ? 'bg-primary/20 ring-2 ring-primary scale-110'
                      : 'hover:bg-base-300/50'
                  }`}
                  onClick={() => {
                    dispatch({ type: 'SET_USER_AVATAR', payload: { userId: currentUser.id, avatar: a.id } })
                    setShowAvatarPicker(false)
                  }}
                >
                  <img src={a.src} alt={a.label} className="w-full rounded-lg object-cover" />
                </button>
              ))}
            </motion.div>
          )}
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const trimmed = nameValue.trim()
                    if (trimmed) {
                      dispatch({ type: 'SET_USER_NAME', payload: { userId: currentUser.id, name: trimmed } })
                    }
                    setEditingName(false)
                  } else if (e.key === 'Escape') {
                    setEditingName(false)
                  }
                }}
                onBlur={() => {
                  const trimmed = nameValue.trim()
                  if (trimmed) {
                    dispatch({ type: 'SET_USER_NAME', payload: { userId: currentUser.id, name: trimmed } })
                  }
                  setEditingName(false)
                }}
                className="input input-bordered text-2xl font-bold text-center w-48 rounded-xl"
                autoFocus
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{currentUser.name}</h2>
              <button
                onClick={() => {
                  setNameValue(currentUser.name)
                  setEditingName(true)
                }}
                className="btn btn-ghost btn-circle btn-sm"
              >
                <svg className="w-4 h-4 text-base-content/40" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card bg-base-200 border border-base-content/5"
      >
        <div className="card-body p-4 gap-3">
          <h3 className="font-bold text-sm text-base-content/60 uppercase tracking-wider">Theme</h3>
          <div className="grid grid-cols-2 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                  t.id === currentTheme
                    ? 'ring-2 ring-primary bg-primary/10'
                    : 'bg-base-100 hover:bg-base-300/50'
                }`}
              >
                <ThemeSwatch themeId={t.id} />
                <span className="text-sm font-medium">{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {!showClear && !showDelete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <button
            className="btn btn-ghost btn-sm text-warning w-full rounded-2xl"
            onClick={() => {
              setShowClear(true)
              setShowDelete(false)
            }}
          >
            Clear All Progress
          </button>
          <button
            className="btn btn-ghost btn-sm text-error w-full rounded-2xl"
            onClick={() => {
              setShowDelete(true)
              setShowClear(false)
            }}
          >
            Delete Profile
          </button>
        </motion.div>
      )}

      {showClear && (
        <MathConfirmCard
          title={`Clear all progress for ${currentUser.name}?`}
          description="This will reset all word mastery and practice history. Your profile and sessions will be kept."
          buttonLabel="Clear Progress"
          color="warning"
          onConfirm={() => {
            dispatch({ type: 'CLEAR_USER_PROGRESS', payload: currentUser.id })
            clearSessions(currentUser.id)
            setShowClear(false)
          }}
          onCancel={() => setShowClear(false)}
        />
      )}

      {showDelete && (
        <MathConfirmCard
          title={`Delete ${currentUser.name}?`}
          description="This will remove all progress and session history for this user. Solve the math problem to confirm."
          buttonLabel="Delete"
          color="error"
          onConfirm={() => {
            dispatch({ type: 'DELETE_USER', payload: currentUser.id })
            navigate('/')
          }}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  )
}

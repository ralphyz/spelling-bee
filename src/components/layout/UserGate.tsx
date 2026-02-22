import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { useApp, verifyPin, setUserPin, changeAdminPin, invalidateSessions } from '../../context/AppContext'
import { AVATARS, getAvatarSrc, DEFAULT_AVATAR } from '../../utils/themes'
import { uuid } from '../../utils/uuid'

const PIN_MIN = 6
const PIN_MAX = 10
const PIN_REGEX = /^[a-zA-Z0-9]*$/

export function UserGate() {
  const { state, dispatch } = useApp()

  if (!state.authenticatedPin) {
    return <PinEntry />
  }

  return <UserSelection />
}

function PinEntry() {
  const { dispatch } = useApp()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [blocked, setBlocked] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (cooldown <= 0 && blocked <= 0) return
    timerRef.current = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1))
      setBlocked((b) => Math.max(0, b - 1))
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [cooldown > 0, blocked > 0])

  useEffect(() => {
    if (cooldown === 0 && blocked === 0) {
      inputRef.current?.focus()
    }
  }, [cooldown, blocked])

  const handleSubmit = async () => {
    if (pin.length < PIN_MIN || pin.length > PIN_MAX || cooldown > 0 || blocked > 0 || submitting) return
    setSubmitting(true)
    const result = await verifyPin(pin)
    setSubmitting(false)
    if ('error' in result) {
      setPin('')
      if (result.error === 'blocked') {
        setBlocked(result.retryAfter || 600)
        setError('Too many attempts')
      } else if (result.error === 'cooldown') {
        setCooldown(result.retryAfter || 3)
        setError('Wrong PIN')
      } else {
        setCooldown(result.cooldown || 3)
        setError('Wrong PIN')
      }
    } else {
      dispatch({ type: 'SET_AUTH', payload: { pin, userIds: result.userIds, isAdmin: result.isAdmin, sessionVersion: result.sessionVersion } })
    }
  }

  const isDisabled = cooldown > 0 || blocked > 0 || submitting
  const canSubmit = pin.length >= PIN_MIN && pin.length <= PIN_MAX && !isDisabled

  const handleChange = (val: string) => {
    if (isDisabled) return
    const filtered = val.replace(/[^a-zA-Z0-9]/g, '').slice(0, PIN_MAX)
    setPin(filtered)
    setError('')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center gap-6 p-6">
      <motion.span
        animate={{ y: [0, -12, 0], rotate: [0, 5, -5, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className="text-7xl leading-none"
      >
        🐝
      </motion.span>

      <div>
        <h1 className="text-3xl font-bold text-primary">RalphyZ's Spelling Bee</h1>
        <p className="text-base-content/60 mt-1">Enter Parent PIN</p>
      </div>

      <div className="w-full max-w-[260px] space-y-3">
        <input
          ref={inputRef}
          type="password"
          maxLength={PIN_MAX}
          value={pin}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="6-10 character PIN"
          className="input input-bordered w-full text-center text-lg tracking-widest rounded-xl"
          autoFocus
          disabled={isDisabled}
          autoComplete="off"
        />

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="btn btn-primary w-full rounded-xl"
        >
          {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Unlock'}
        </button>
      </div>

      <div className="h-6">
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-error text-sm font-semibold"
          >
            {error}
            {blocked > 0 && `. Try again in ${Math.floor(blocked / 60)}:${String(blocked % 60).padStart(2, '0')}`}
            {cooldown > 0 && blocked <= 0 && ` (${cooldown}s)`}
          </motion.p>
        )}
      </div>
    </div>
  )
}

function UserSelection() {
  const { state, dispatch } = useApp()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR)
  const [settingPinFor, setSettingPinFor] = useState<string | null>(null)
  const [newPin, setNewPin] = useState('')
  const [pinError, setPinError] = useState('')
  // Admin PIN change
  const [changingAdminPin, setChangingAdminPin] = useState(false)
  const [newAdminPin, setNewAdminPin] = useState('')
  const [confirmAdminPin, setConfirmAdminPin] = useState('')
  const [adminPinError, setAdminPinError] = useState('')
  const [adminPinSuccess, setAdminPinSuccess] = useState(false)

  const visibleUsers = state.users.filter((u) => state.authenticatedUserIds.includes(u.id))

  const handleAdd = async () => {
    if (!name.trim()) return
    const id = uuid()
    dispatch({ type: 'ADD_USER', payload: { id, name: name.trim(), avatar } })

    if (!state.isAdmin && state.authenticatedPin) {
      await setUserPin(id, state.authenticatedPin, state.authenticatedPin)
    }

    dispatch({ type: 'SET_CURRENT_USER', payload: id })
    dispatch({
      type: 'SET_AUTH',
      payload: {
        pin: state.authenticatedPin!,
        userIds: [...state.authenticatedUserIds, id],
        isAdmin: state.isAdmin,
      },
    })
    setName('')
    setAvatar(DEFAULT_AVATAR)
    setAdding(false)
  }

  const handleSelect = (userId: string) => {
    dispatch({ type: 'SET_CURRENT_USER', payload: userId })
  }

  const handleSetPin = async (userId: string) => {
    if (newPin.length < PIN_MIN || newPin.length > PIN_MAX) {
      setPinError(`PIN must be ${PIN_MIN}-${PIN_MAX} characters`)
      return
    }
    if (!PIN_REGEX.test(newPin)) {
      setPinError('Letters and numbers only')
      return
    }
    const ok = await setUserPin(userId, newPin, state.authenticatedPin!)
    if (ok) {
      setSettingPinFor(null)
      setNewPin('')
      setPinError('')
    }
  }

  const handleChangeAdminPin = async () => {
    if (newAdminPin.length < PIN_MIN || newAdminPin.length > PIN_MAX) {
      setAdminPinError(`PIN must be ${PIN_MIN}-${PIN_MAX} characters`)
      return
    }
    if (!PIN_REGEX.test(newAdminPin)) {
      setAdminPinError('Letters and numbers only')
      return
    }
    if (newAdminPin !== confirmAdminPin) {
      setAdminPinError('PINs do not match')
      return
    }
    const ok = await changeAdminPin(state.authenticatedPin!, newAdminPin)
    if (ok) {
      dispatch({ type: 'SET_AUTH', payload: { pin: newAdminPin, userIds: state.authenticatedUserIds, isAdmin: true } })
      setNewAdminPin('')
      setConfirmAdminPin('')
      setAdminPinError('')
      setAdminPinSuccess(true)
      setTimeout(() => {
        setAdminPinSuccess(false)
        setChangingAdminPin(false)
      }, 2000)
    } else {
      setAdminPinError('Failed to change admin PIN')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center gap-6 p-6">
      <motion.span
        animate={{ y: [0, -12, 0], rotate: [0, 5, -5, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className="text-7xl leading-none"
      >
        🐝
      </motion.span>

      <div>
        <h1 className="text-3xl font-bold text-primary">RalphyZ's Spelling Bee</h1>
        <p className="text-base-content/60 mt-1">Who's spelling today?</p>
      </div>

      {!adding && !changingAdminPin && (
        <>
          <div className="flex gap-4 overflow-x-auto max-w-full px-2 py-2 scrollbar-none flex-wrap justify-center">
            {visibleUsers.map((user, i) => {
              const src = getAvatarSrc(user.avatar)
              const hasNoPin = !user.pin && state.isAdmin
              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex flex-col items-center gap-1"
                >
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelect(user.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl bg-base-200 hover:bg-base-300/60 active:bg-base-300 transition-colors min-w-[90px] shadow-sm ${
                      hasNoPin ? 'ring-2 ring-warning/50' : ''
                    }`}
                  >
                    {src ? (
                      <img src={src} alt="" className="w-16 h-16 rounded-2xl object-cover ring-2 ring-primary/20 bg-white" />
                    ) : (
                      <span className="text-4xl leading-none">{user.avatar}</span>
                    )}
                    <span className="text-sm font-semibold truncate max-w-[80px]">{user.name}</span>
                  </motion.button>
                  {/* Admin: Set PIN (no pin) or Reset PIN (has pin) */}
                  {state.isAdmin && settingPinFor !== user.id && (
                    <button
                      className={`btn btn-sm rounded-xl mt-1 gap-1 ${hasNoPin ? 'btn-warning' : 'btn-ghost btn-xs text-base-content/40'}`}
                      onClick={() => {
                        setSettingPinFor(user.id)
                        setNewPin('')
                        setPinError('')
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                      </svg>
                      {hasNoPin ? 'Set PIN' : 'Reset PIN'}
                    </button>
                  )}
                  {settingPinFor === user.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex flex-col items-center gap-2 mt-2 p-3 bg-base-200 rounded-xl w-full min-w-[180px]"
                    >
                      <p className="text-xs font-semibold text-base-content/60">
                        {user.pin ? 'Reset' : 'Assign'} PIN for {user.name}
                      </p>
                      <input
                        type="text"
                        maxLength={PIN_MAX}
                        placeholder={`${PIN_MIN}-${PIN_MAX} chars`}
                        value={newPin}
                        onChange={(e) => {
                          setNewPin(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, PIN_MAX))
                          setPinError('')
                        }}
                        className="input input-bordered input-sm w-full text-center rounded-lg"
                        autoFocus
                        autoComplete="off"
                        onKeyDown={(e) => e.key === 'Enter' && handleSetPin(user.id)}
                      />
                      {pinError && <p className="text-error text-xs">{pinError}</p>}
                      <div className="flex gap-2 w-full">
                        <button className="btn btn-sm btn-ghost flex-1 rounded-lg" onClick={() => { setSettingPinFor(null); setPinError('') }}>
                          Cancel
                        </button>
                        <button
                          className="btn btn-sm btn-primary flex-1 rounded-lg"
                          onClick={() => handleSetPin(user.id)}
                          disabled={newPin.length < PIN_MIN}
                        >
                          Save
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-ghost btn-sm rounded-xl text-primary gap-1"
            onClick={() => setAdding(true)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add New Speller
          </motion.button>

          {/* Admin buttons */}
          {state.isAdmin && (
            <>
              <button
                className="btn btn-ghost btn-xs rounded-xl text-base-content/40 gap-1"
                onClick={() => {
                  setChangingAdminPin(true)
                  setNewAdminPin('')
                  setConfirmAdminPin('')
                  setAdminPinError('')
                  setAdminPinSuccess(false)
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                </svg>
                Change Admin PIN
              </button>
              <button
                className="btn btn-ghost btn-xs rounded-xl text-base-content/40 gap-1"
                onClick={async () => {
                  const ok = await invalidateSessions(state.authenticatedPin!)
                  if (ok) {
                    dispatch({ type: 'CLEAR_AUTH' })
                  }
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Invalidate All Sessions
              </button>
            </>
          )}
        </>
      )}

      {/* Admin PIN change form */}
      {changingAdminPin && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xs space-y-3"
        >
          <p className="font-bold text-sm">Change Admin PIN</p>
          <input
            type="password"
            maxLength={PIN_MAX}
            placeholder="New admin PIN"
            value={newAdminPin}
            onChange={(e) => {
              setNewAdminPin(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, PIN_MAX))
              setAdminPinError('')
            }}
            className="input input-bordered w-full text-center rounded-xl"
            autoFocus
            autoComplete="off"
          />
          <input
            type="password"
            maxLength={PIN_MAX}
            placeholder="Confirm new PIN"
            value={confirmAdminPin}
            onChange={(e) => {
              setConfirmAdminPin(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, PIN_MAX))
              setAdminPinError('')
            }}
            className="input input-bordered w-full text-center rounded-xl"
            autoComplete="off"
            onKeyDown={(e) => e.key === 'Enter' && handleChangeAdminPin()}
          />
          {adminPinError && <p className="text-error text-xs">{adminPinError}</p>}
          {adminPinSuccess && <p className="text-success text-sm font-semibold">Admin PIN changed!</p>}
          <div className="flex gap-2">
            <button
              className="btn btn-ghost flex-1 rounded-xl"
              onClick={() => setChangingAdminPin(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary flex-1 rounded-xl"
              onClick={handleChangeAdminPin}
              disabled={newAdminPin.length < PIN_MIN || confirmAdminPin.length < PIN_MIN}
            >
              Save
            </button>
          </div>
        </motion.div>
      )}

      {adding && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xs space-y-3"
        >
          <input
            type="text"
            placeholder="Speller's name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input input-bordered w-full rounded-xl"
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
              className="btn btn-ghost flex-1 rounded-xl"
              onClick={() => setAdding(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary flex-1 rounded-xl"
              onClick={handleAdd}
              disabled={!name.trim()}
            >
              Add Speller
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

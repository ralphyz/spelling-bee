import { useState } from 'react'
import { motion } from 'motion/react'
import { useSound } from '../../hooks/useSound'
import { useApp } from '../../context/AppContext'
import { incrementDeletes } from '../../utils/mishchievements'

const rows = [
  'qwertyuiop'.split(''),
  'asdfghjkl'.split(''),
  'zxcvbnm'.split(''),
]

interface AlphabetKeyboardProps {
  onKey: (letter: string) => void
  onDelete: () => void
  onSubmit?: () => void
  submitLabel?: string
  disabled?: boolean
}

export function AlphabetKeyboard({
  onKey,
  onDelete,
  onSubmit,
  submitLabel = "I'm Done!",
  disabled = false,
}: AlphabetKeyboardProps) {
  const { tapSound, deleteSound } = useSound()
  const { state } = useApp()
  const [shifted, setShifted] = useState(false)
  const currentUser = state.users.find((u) => u.id === state.currentUserId)
  const scale = currentUser?.keyboardScale ?? 1

  const keyH = Math.round(52 * scale)
  const keyW = `${9 * scale}vw`
  const keyMax = Math.round(44 * scale)
  const fontSize = Math.round(18 * scale)
  const gap = Math.max(2, Math.round(4 * scale))

  const handleKey = (letter: string) => {
    if (disabled) return
    tapSound()
    const out = shifted ? letter.toUpperCase() : letter
    onKey(out)
    if (shifted) setShifted(false)
  }

  const handleDelete = () => {
    if (disabled) return
    deleteSound()
    incrementDeletes(state.currentUserId)
    onDelete()
  }

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto" style={{ gap }}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center w-full" style={{ gap: Math.max(2, Math.round(4 * scale)) }}>
          {rowIndex === 2 && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              className={`btn btn-sm h-auto min-h-0 px-2 font-bold rounded-xl ${shifted ? 'btn-primary' : 'btn-ghost border border-base-content/20'}`}
              style={{ height: keyH, minHeight: keyH, fontSize }}
              onClick={() => setShifted(!shifted)}
              disabled={disabled}
            >
              ⇧
            </motion.button>
          )}
          {row.map((letter) => (
            <motion.button
              key={letter}
              whileTap={{ scale: 0.85 }}
              className="btn btn-sm btn-outline btn-primary h-auto min-h-0 font-bold rounded-xl"
              style={{ height: keyH, minHeight: keyH, width: keyW, maxWidth: keyMax, fontSize }}
              onClick={() => handleKey(letter)}
              disabled={disabled}
            >
              {shifted ? letter.toUpperCase() : letter}
            </motion.button>
          ))}
          {rowIndex === 2 && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="btn btn-sm btn-error text-white h-auto min-h-0 px-2 font-bold rounded-xl"
              style={{ height: keyH, minHeight: keyH, fontSize }}
              onClick={handleDelete}
              disabled={disabled}
            >
              ⌫
            </motion.button>
          )}
        </div>
      ))}
      {onSubmit && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="btn btn-success btn-lg text-white text-lg font-bold w-full max-w-xs mt-2 rounded-2xl"
          onClick={onSubmit}
          disabled={disabled}
        >
          {submitLabel}
        </motion.button>
      )}
    </div>
  )
}

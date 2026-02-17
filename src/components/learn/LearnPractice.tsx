import { motion } from 'motion/react'
import { AlphabetKeyboard } from '../shared/AlphabetKeyboard'
import { LetterTileRow } from '../shared/LetterTileRow'
import { AudioButton } from '../shared/AudioButton'
import type { WordEntry } from '../../types'

interface LearnPracticeProps {
  word: WordEntry
  typedLetters: string[]
  onKey: (letter: string) => void
  onDelete: () => void
  onSubmit: () => void
}

export function LearnPractice({
  word,
  typedLetters,
  onKey,
  onDelete,
  onSubmit,
}: LearnPracticeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      <div className="text-center">
        <p className="text-lg text-base-content/70 mb-2">
          Now spell it from memory!
        </p>
        <div className="flex items-center justify-center gap-2">
          <AudioButton word={word.word} audioUrl={word.audioUrl} size="lg" />
          {word.definition && (
            <div className="tooltip tooltip-bottom" data-tip={word.definition}>
              <button className="btn btn-ghost btn-circle btn-sm text-base-content/40">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <LetterTileRow letters={typedLetters} />

      <AlphabetKeyboard
        onKey={onKey}
        onDelete={onDelete}
        onSubmit={onSubmit}
        submitLabel="Check It!"
      />
    </motion.div>
  )
}

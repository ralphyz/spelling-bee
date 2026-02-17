import { useState } from 'react'
import { motion } from 'motion/react'
import { AudioButton } from '../shared/AudioButton'
import type { WordEntry } from '../../types'

interface QuizPromptProps {
  word: WordEntry
  onStart: () => void
}

export function QuizPrompt({ word, onStart }: QuizPromptProps) {
  const [showDef, setShowDef] = useState(false)
  const [showPos, setShowPos] = useState(false)
  const [showExample, setShowExample] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 text-center"
    >
      <p className="text-xl font-bold text-base-content">
        Listen to the word, then spell it!
      </p>

      <AudioButton
        word={word.word}
        audioUrl={word.audioUrl}
        size="lg"
        label="Hear the word"
      />

      <div className="flex flex-wrap gap-2 justify-center">
        {word.definition && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="btn btn-outline btn-sm rounded-xl"
            onClick={() => setShowDef(!showDef)}
          >
            {showDef ? 'Hide' : 'Show'} Definition
          </motion.button>
        )}
        {word.partOfSpeech && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="btn btn-outline btn-sm rounded-xl"
            onClick={() => setShowPos(!showPos)}
          >
            {showPos ? 'Hide' : 'Show'} Part of Speech
          </motion.button>
        )}
        {word.example && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="btn btn-outline btn-sm rounded-xl"
            onClick={() => setShowExample(!showExample)}
          >
            {showExample ? 'Hide' : 'Show'} Sentence
          </motion.button>
        )}
      </div>

      {showDef && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-base-content/80 bg-base-200 p-3 rounded-xl"
        >
          {word.definition}
        </motion.p>
      )}
      {showPos && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="badge badge-secondary badge-lg">
            {word.partOfSpeech}
          </span>
        </motion.div>
      )}
      {showExample && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-base-content/60 italic bg-base-200 p-3 rounded-xl"
        >
          "{word.example}"
        </motion.p>
      )}

      <motion.button
        whileTap={{ scale: 0.95 }}
        className="btn btn-primary btn-lg w-full max-w-xs rounded-2xl text-lg"
        onClick={onStart}
      >
        Start Spelling
      </motion.button>
    </motion.div>
  )
}

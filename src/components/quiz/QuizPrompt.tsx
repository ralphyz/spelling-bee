import { useState } from 'react'
import { motion } from 'motion/react'
import { AudioButton } from '../shared/AudioButton'
import { maskWordInText } from '../../utils/maskWord'
import type { WordEntry } from '../../types'

interface QuizPromptProps {
  word: WordEntry
  onStart: () => void
}

export function QuizPrompt({ word, onStart }: QuizPromptProps) {
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

      {word.definition && (
        <p className="text-base-content/80 bg-base-200 p-3 rounded-xl">
          {word.definition}
        </p>
      )}

      <div className="flex flex-wrap gap-2 justify-center">
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
          "{maskWordInText(word.example, word.word)}"
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

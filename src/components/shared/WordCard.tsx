import { AudioButton } from './AudioButton'
import type { WordEntry } from '../../types'

interface WordCardProps {
  word: WordEntry
  showWord?: boolean
}

export function WordCard({ word, showWord = true }: WordCardProps) {
  return (
    <div className="card bg-base-200 shadow-md">
      <div className="card-body items-center text-center gap-3 p-5">
        {showWord && (
          <h2 className="card-title text-3xl text-primary">{word.word}</h2>
        )}
        {word.phonetic && (
          <p className="text-base-content/50 text-sm">{word.phonetic}</p>
        )}
        <AudioButton word={word.word} audioUrl={word.audioUrl} size="lg" />
        {word.partOfSpeech && (
          <span className="badge badge-secondary badge-lg font-medium">
            {word.partOfSpeech}
          </span>
        )}
        {word.definition && (
          <p className="text-base-content text-base leading-relaxed">
            {word.definition}
          </p>
        )}
        {word.example && (
          <p className="text-base-content/60 italic text-sm">
            "{word.example}"
          </p>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { motion } from 'motion/react'
import { useApp } from '../../context/AppContext'
import { useDictionary } from '../../hooks/useDictionary'
import { parseWordList } from '../../utils/wordParser'

export function WordListForm() {
  const { dispatch } = useApp()
  const { fetchWords, loading, progress } = useDictionary()
  const [name, setName] = useState('')
  const [wordsInput, setWordsInput] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Please give your list a name.')
      return
    }

    const parsed = parseWordList(wordsInput)
    if (parsed.length === 0) {
      setError('Please enter at least one word.')
      return
    }

    const words = await fetchWords(parsed)

    const list = {
      id: crypto.randomUUID(),
      name: trimmedName,
      words,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    dispatch({ type: 'ADD_LIST', payload: list })
    setName('')
    setWordsInput('')
  }

  return (
    <div className="card bg-base-200 shadow-md">
      <div className="card-body gap-4">
        <h3 className="card-title text-lg">Add Word List</h3>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">List Name</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Week 5 Words"
            className="input input-bordered w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">
              Words (comma or newline separated)
            </span>
          </label>
          <textarea
            className="textarea textarea-bordered h-32 text-base"
            placeholder="apple, banana, cherry&#10;or one word per line"
            value={wordsInput}
            onChange={(e) => setWordsInput(e.target.value)}
            disabled={loading}
          />
        </div>

        {error && (
          <div className="text-error text-sm font-medium">{error}</div>
        )}

        {loading && (
          <div className="w-full">
            <p className="text-sm text-base-content/70 mb-1">
              Fetching definitions...
            </p>
            <progress
              className="progress progress-primary w-full"
              value={progress}
              max="100"
            />
          </div>
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          className="btn btn-primary btn-lg rounded-2xl"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <span className="loading loading-spinner" />
          ) : (
            'Save List'
          )}
        </motion.button>
      </div>
    </div>
  )
}

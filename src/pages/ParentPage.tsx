import { WordListForm } from '../components/parent/WordListForm'
import { WordListManager } from '../components/parent/WordListManager'

export function ParentPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <WordListForm />
      <WordListManager />
    </div>
  )
}

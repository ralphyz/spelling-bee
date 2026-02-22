import { WordListForm } from '../components/parent/WordListForm'
import { WordListManager } from '../components/parent/WordListManager'
import { BeeBuddy } from '../components/shared/BeeBuddy'
import { PageAvatar } from '../components/shared/PageAvatar'

export function ParentPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <BeeBuddy mood="neutral" size="lg" message="Manage your hives!" />
        <PageAvatar pose="home" size="lg" />
      </div>
      <WordListForm />
      <WordListManager />
    </div>
  )
}

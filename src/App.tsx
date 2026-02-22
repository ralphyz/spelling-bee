import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AudioPreloader } from './components/shared/AudioPreloader'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { AppShell } from './components/layout/AppShell'
import { HomePage } from './pages/HomePage'
import { ParentPage } from './pages/ParentPage'
import { LearnPage } from './pages/LearnPage'
import { PracticePage } from './pages/PracticePage'
import { QuizPage } from './pages/QuizPage'
import { ProgressPage } from './pages/ProgressPage'
import { OptionsPage } from './pages/OptionsPage'
import { UserProfilePage } from './pages/UserProfilePage'
import { ReportPage } from './pages/ReportPage'
import { MissingLettersPage } from './pages/MissingLettersPage'

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AudioPreloader />
        <ErrorBoundary>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/parent" element={<ParentPage />} />
              <Route path="/practice" element={<PracticePage />} />
              <Route path="/learn" element={<LearnPage />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/missing-letters" element={<MissingLettersPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/options" element={<OptionsPage />} />
              <Route path="/profile" element={<UserProfilePage />} />
              <Route path="/report" element={<ReportPage />} />
            </Route>
          </Routes>
        </ErrorBoundary>
      </AppProvider>
    </BrowserRouter>
  )
}

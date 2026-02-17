import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AppShell } from './components/layout/AppShell'
import { HomePage } from './pages/HomePage'
import { ParentPage } from './pages/ParentPage'
import { LearnPage } from './pages/LearnPage'
import { QuizPage } from './pages/QuizPage'
import { ProgressPage } from './pages/ProgressPage'
import { OptionsPage } from './pages/OptionsPage'
import { UserProfilePage } from './pages/UserProfilePage'
import { ReportPage } from './pages/ReportPage'

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/parent" element={<ParentPage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/options" element={<OptionsPage />} />
            <Route path="/profile" element={<UserProfilePage />} />
            <Route path="/report" element={<ReportPage />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  )
}

import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import LandingPage from './components/LandingPage'
import WheelPage from './components/WheelPage'
import AddNamePage from './components/AddNamePage'
import SquadScramblePage from './components/squad-scramble/SquadScramblePage'
import SignupForm from './components/auth/SignupForm'
import LoginForm from './components/auth/LoginForm'
import ResetPasswordForm from './components/auth/ResetPasswordForm'
import Dashboard from './components/dashboard/Dashboard'
import EventLayout from './components/events/EventLayout'
import RegisterPage from './components/registration/RegisterPage'
import ProtectedRoute from './components/ProtectedRoute'
import QuizListPage from './components/quiz/QuizListPage'
import QuizEditorPage from './components/quiz/QuizEditorPage'
import QuizLobbyHost from './components/quiz/QuizLobbyHost'
import QuizHostView from './components/quiz/QuizHostView'
import QuizHostViewRacing from './components/quiz/QuizHostViewRacing'
import QuizJoinPage from './components/quiz/QuizJoinPage'
import QuizPlayerWaiting from './components/quiz/QuizPlayerWaiting'
import QuizPlayerGame from './components/quiz/QuizPlayerGame'
import PollListPage from './components/polling/PollListPage'
import PollEditorPage from './components/polling/PollEditorPage'
import PollHostView from './components/polling/PollHostView'
import PollJoinPage from './components/polling/PollJoinPage'
import PollRespondView from './components/polling/PollRespondView'
import LivePollPage from './components/polling/LivePollPage'
import WorkshopTipsPage from './components/WorkshopTipsPage'

function App() {
  const location = useLocation()
  const hideFooter = location.pathname === '/'

  // Apply dark theme to non-landing pages
  useEffect(() => {
    const lightThemePages = ['/', '/workshop-tips']
    if (lightThemePages.includes(location.pathname)) {
      document.body.classList.remove('dark-theme')
    } else {
      document.body.classList.add('dark-theme')
    }
  }, [location.pathname])

  return (
    <>
      <Header />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/workshop-tips" element={<WorkshopTipsPage />} />
        <Route path="/nameroulette" element={<WheelPage />} />
        <Route path="/squadscramble" element={<SquadScramblePage />} />
        <Route path="/add-name" element={<AddNamePage />} />
        <Route path="/squad-scramble" element={<SquadScramblePage />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/reset-password" element={<ResetPasswordForm />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id"
          element={
            <ProtectedRoute>
              <EventLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id/:tab"
          element={
            <ProtectedRoute>
              <EventLayout />
            </ProtectedRoute>
          }
        />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/quizrace" element={<ProtectedRoute><QuizListPage /></ProtectedRoute>} />
        <Route
          path="/quiz-builder"
          element={
            <ProtectedRoute>
              <QuizListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz-builder/:quizId"
          element={
            <ProtectedRoute>
              <QuizEditorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz-race/:quizId/lobby"
          element={
            <ProtectedRoute>
              <QuizLobbyHost />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz-race/:sessionId/host"
          element={
            <ProtectedRoute>
              <QuizHostView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz-race/:sessionId/host-racing"
          element={
            <ProtectedRoute>
              <QuizHostViewRacing />
            </ProtectedRoute>
          }
        />
        <Route path="/quiz-race/:sessionId/join" element={<QuizJoinPage />} />
        <Route path="/quiz-race/:sessionId/play" element={<QuizPlayerWaiting />} />
        <Route path="/quiz-race/:sessionId/game" element={<QuizPlayerGame />} />

        {/* Live Poll Routes */}
        <Route path="/live-poll" element={<LivePollPage />} />
        <Route path="/polling" element={<ProtectedRoute><PollListPage /></ProtectedRoute>} />
        <Route path="/polling/builder/:pollId" element={<ProtectedRoute><PollEditorPage /></ProtectedRoute>} />
        <Route path="/polling/:sessionId/host" element={<ProtectedRoute><PollHostView /></ProtectedRoute>} />
        <Route path="/polling/:sessionId/join" element={<PollJoinPage />} />
        <Route path="/polling/:sessionId/respond" element={<PollRespondView />} />
      </Routes>
      </main>
      {!hideFooter && <Footer />}
      <Analytics />
    </>
  )
}

export default App

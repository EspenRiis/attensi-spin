import { Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
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
import QuizJoinPage from './components/quiz/QuizJoinPage'
import QuizPlayerWaiting from './components/quiz/QuizPlayerWaiting'

function App() {
  return (
    <>
      <Header />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
        <Route path="/" element={<WheelPage />} />
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
        <Route path="/quiz-race/:sessionId/join" element={<QuizJoinPage />} />
        <Route path="/quiz-race/:sessionId/play" element={<QuizPlayerWaiting />} />
        <Route path="/quiz-race/:sessionId/game" element={<div>Game view coming soon...</div>} />
      </Routes>
      </main>
      <Footer />
      <Analytics />
    </>
  )
}

export default App

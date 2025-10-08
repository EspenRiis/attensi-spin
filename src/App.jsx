import { Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import WheelPage from './components/WheelPage'
import AddNamePage from './components/AddNamePage'
import SignupForm from './components/auth/SignupForm'
import LoginForm from './components/auth/LoginForm'
import ResetPasswordForm from './components/auth/ResetPasswordForm'
import Dashboard from './components/dashboard/Dashboard'
import EventLayout from './components/events/EventLayout'
import RegisterPage from './components/registration/RegisterPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <>
      <Header />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
        <Route path="/" element={<WheelPage />} />
        <Route path="/add-name" element={<AddNamePage />} />
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
      </Routes>
      </main>
      <Footer />
      <Analytics />
    </>
  )
}

export default App

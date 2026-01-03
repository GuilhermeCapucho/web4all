import './App.css'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { Profile } from './pages/Profile'
import { TeacherStudents } from './pages/TeacherStudents'
import { VoiceFab } from './components/VoiceFab'
import { AccessibilityWidget } from './components/AccessibilityWidget'
import { ArrowKeyNavigator } from './components/ArrowKeyNavigator'

const HomeRedirect = () => {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="page-loader" role="status" aria-live="polite" aria-label="Carregando">
        <div className="spinner" aria-hidden="true" />
      </div>
    )
  }

  return (
    <Navigate to={user ? '/app' : '/login'} replace />
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="colorblind-layer">
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/students"
              element={
                <ProtectedRoute>
                  <TeacherStudents />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <VoiceFab/>
        <AccessibilityWidget/>
        <ArrowKeyNavigator />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

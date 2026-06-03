import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './lib/AuthContext'
import LoginPage from './pages/LoginPage'
import CondutorApp from './pages/CondutorApp'
import AdminApp from './pages/AdminApp'

function Router() {
  const { user, condutor, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading" style={{ minHeight: '100dvh' }}>
        <div className="spinner" />
        Carregando...
      </div>
    )
  }

  if (!user) return <LoginPage />

  if (condutor?.is_admin) return <AdminApp />

  return <CondutorApp />
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            fontFamily: 'DM Sans, system-ui, sans-serif',
            fontSize: '13px',
          }
        }}
      />
    </AuthProvider>
  )
}

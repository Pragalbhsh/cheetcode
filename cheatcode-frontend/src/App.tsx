import type { ReactElement } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ToastProvider } from './components/ToastProvider'
import { isLoggedIn } from './lib/auth'
import Daily from './pages/Daily'
import Landing from './pages/Landing'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Onboarding from './pages/Onboarding'
import Progress from './pages/Progress'
import Register from './pages/Register'
import Review from './pages/Review'
import Roadmap from './pages/Roadmap'
import Settings from './pages/Settings'

function RequireAuth({ children }: { children: ReactElement }) {
  const location = useLocation()
  if (!isLoggedIn()) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  }
  return children
}

function GuestOnly({ children }: { children: ReactElement }) {
  return isLoggedIn() ? <Navigate to="/daily" replace /> : children
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GuestOnly><Landing /></GuestOnly>} />
          <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
          <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route path="/daily" element={<Daily />} />
            <Route path="/review" element={<Review />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="/today" element={<Navigate to="/daily" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App

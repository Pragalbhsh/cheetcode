import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Onboarding from './pages/Onboarding'
import Daily from './pages/Daily'

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const userId = localStorage.getItem('userId')
  return userId ? children : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/daily" element={
          <ProtectedRoute>
            <Daily />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
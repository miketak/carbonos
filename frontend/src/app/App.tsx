import { Route, Routes } from 'react-router-dom'
import { AdminUsersPage } from '../features/admin/AdminUsersPage'
import { LoginPage } from '../features/auth/LoginPage'
import { RequireAuth } from '../features/auth/RequireAuth'
import { HomePage } from '../features/home/HomePage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/admin/users"
        element={
          <RequireAuth role="ADMIN">
            <AdminUsersPage />
          </RequireAuth>
        }
      />
    </Routes>
  )
}

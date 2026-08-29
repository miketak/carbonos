import { Route, Routes } from 'react-router-dom'
import { AdminUsersPage } from '../features/admin/AdminUsersPage'
import { LoginPage } from '../features/auth/LoginPage'
import { RequireAuth } from '../features/auth/RequireAuth'
import { HomePage } from '../features/home/HomePage'
import { OrganizationPage } from '../features/ghg/OrganizationPage'
import { OrganizationsPage } from '../features/ghg/OrganizationsPage'
import { WelcomePage } from '../features/home/WelcomePage'
import { ProfilePage } from '../features/profile/ProfilePage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <WelcomePage />
          </RequireAuth>
        }
      />
      <Route
        path="/app/ghg"
        element={
          <RequireAuth>
            <OrganizationsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/app/ghg/:organizationId"
        element={
          <RequireAuth>
            <OrganizationPage />
          </RequireAuth>
        }
      />
      <Route
        path="/app/profile"
        element={
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        }
      />
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

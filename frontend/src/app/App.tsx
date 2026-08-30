import { Route, Routes } from 'react-router-dom'
import { AmbientBackground } from '../components/AmbientBackground'
import { SetPasswordPage } from '../features/access/SetPasswordPage'
import { AdminUsersPage } from '../features/admin/AdminUsersPage'
import { LoginPage } from '../features/auth/LoginPage'
import { RequireAuth } from '../features/auth/RequireAuth'
import { SplashGate } from '../features/auth/SplashScreen'
import { HomePage } from '../features/home/HomePage'
import { ActivityPage } from '../features/ghg/ActivityPage'
import { EmissionFactorsPage } from '../features/ghg/EmissionFactorsPage'
import { FacilitiesPage } from '../features/ghg/FacilitiesPage'
import { InventoriesPage } from '../features/ghg/InventoriesPage'
import { InventoryDetailPage } from '../features/ghg/InventoryDetailPage'
import { OrganizationLayout } from '../features/ghg/OrganizationLayout'
import { OrganizationsPage } from '../features/ghg/OrganizationsPage'
import { OverviewPage } from '../features/ghg/OverviewPage'
import { RunDetailPage } from '../features/ghg/RunDetailPage'
import { WelcomePage } from '../features/home/WelcomePage'
import { ProfilePage } from '../features/profile/ProfilePage'

export function App() {
  return (
    <>
      <AmbientBackground />
      <SplashGate />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/set-password" element={<SetPasswordPage />} />
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
              <OrganizationLayout />
            </RequireAuth>
          }
        >
          <Route index element={<OverviewPage />} />
          <Route path="facilities" element={<FacilitiesPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="inventories" element={<InventoriesPage />} />
          <Route path="inventories/:inventoryId" element={<InventoryDetailPage />} />
          <Route path="inventories/:inventoryId/runs/:runId" element={<RunDetailPage />} />
          <Route path="factors" element={<EmissionFactorsPage />} />
        </Route>
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
    </>
  )
}

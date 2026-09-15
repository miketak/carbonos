import { Navigate, Route, Routes } from 'react-router-dom'
import { AmbientBackground } from '../components/AmbientBackground'
import { SetPasswordPage } from '../features/access/SetPasswordPage'
import { AdminAccessRequestsPage } from '../features/admin/AdminAccessRequestsPage'
import { AdminDashboardPage } from '../features/admin/AdminDashboardPage'
import { AdminFactorPackEditionPage } from '../features/admin/AdminFactorPackEditionPage'
import { AdminFactorPacksPage } from '../features/admin/AdminFactorPacksPage'
import { AdminLayout } from '../features/admin/AdminLayout'
import { AdminOrganizationsPage } from '../features/admin/AdminOrganizationsPage'
import { AdminSettingsPage } from '../features/admin/AdminSettingsPage'
import { AdminUsersPage } from '../features/admin/AdminUsersPage'
import { LoginPage } from '../features/auth/LoginPage'
import { RequireAuth } from '../features/auth/RequireAuth'
import { SplashGate } from '../features/auth/SplashScreen'
import { HomePage } from '../features/home/HomePage'
import { ActivityPage } from '../features/ghg/ActivityPage'
import { SourceDocumentsPage } from '../features/ghg/SourceDocumentsPage'
import { BaseYearPage } from '../features/ghg/BaseYearPage'
import { EntitiesPage } from '../features/ghg/EntitiesPage'
import { EmissionFactorsPage } from '../features/ghg/EmissionFactorsPage'
import { FactorPackUpdatesPage } from '../features/ghg/FactorPackUpdatesPage'
import { UnitsPage } from '../features/ghg/UnitsPage'
import { FacilitiesPage } from '../features/ghg/FacilitiesPage'
import { InventoriesPage } from '../features/ghg/InventoriesPage'
import { InventoryDetailPage } from '../features/ghg/InventoryDetailPage'
import { OrganizationLayout } from '../features/ghg/OrganizationLayout'
import { OrganizationsPage } from '../features/ghg/OrganizationsPage'
import { OverviewPage } from '../features/ghg/OverviewPage'
import { RunDetailPage } from '../features/ghg/RunDetailPage'
import { LandingRedirect } from '../features/home/LandingRedirect'
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
              <LandingRedirect />
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
          <Route path="entities" element={<EntitiesPage />} />
          <Route path="facilities" element={<FacilitiesPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="activity/documents" element={<SourceDocumentsPage />} />
          <Route path="inventories" element={<InventoriesPage />} />
          <Route path="inventories/:inventoryId" element={<InventoryDetailPage />} />
          <Route path="inventories/:inventoryId/runs/:runId" element={<RunDetailPage />} />
          <Route path="base-year" element={<BaseYearPage />} />
          <Route path="factors" element={<EmissionFactorsPage />} />
          <Route path="factor-updates" element={<FactorPackUpdatesPage />} />
          <Route path="units" element={<UnitsPage />} />
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
          path="/admin"
          element={
            <RequireAuth role="ADMIN">
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="access-requests" element={<AdminAccessRequestsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="organizations" element={<AdminOrganizationsPage />} />
          <Route path="factor-packs" element={<AdminFactorPacksPage />} />
          <Route path="factor-packs/:editionId" element={<AdminFactorPackEditionPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          {/* a stale bookmark lands on the dashboard rather than a blank page */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </>
  )
}

import { lazy, Suspense } from 'react'
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
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage'
import { LoginPage } from '../features/auth/LoginPage'
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage'
import { RequireAuth } from '../features/auth/RequireAuth'
import { SplashGate } from '../features/auth/SplashScreen'
import { HomePage } from '../features/home/HomePage'
import { ActivityPage } from '../features/ghg/ActivityPage'
import { SourceDocumentsPage } from '../features/ghg/SourceDocumentsPage'
import { BaseYearPage } from '../features/ghg/BaseYearPage'
import { SettingsLayout } from '../features/ghg/SettingsLayout'
import { EntitiesPage } from '../features/ghg/EntitiesPage'
import { EntityFormPage } from '../features/ghg/EntityFormPage'
import { EmissionFactorsPage } from '../features/ghg/EmissionFactorsPage'
import { FactorPackUpdatesPage } from '../features/ghg/FactorPackUpdatesPage'
import { UnitsPage } from '../features/ghg/UnitsPage'
import { FacilitiesPage } from '../features/ghg/FacilitiesPage'
import { FacilityFormPage } from '../features/ghg/FacilityFormPage'
import { InventoriesPage } from '../features/ghg/InventoriesPage'
import { InventoryDetailPage } from '../features/ghg/InventoryDetailPage'
import { InventoryFormPage } from '../features/ghg/InventoryFormPage'
import { OrganizationLayout } from '../features/ghg/OrganizationLayout'
import { OrganizationSettingsPage } from '../features/ghg/OrganizationSettingsPage'
import { OrganizationsPage } from '../features/ghg/OrganizationsPage'
import { OverviewPage } from '../features/ghg/OverviewPage'
import { RunDetailPage } from '../features/ghg/RunDetailPage'
import { LandingRedirect } from '../features/home/LandingRedirect'
import { HelpFrameSkeleton } from '../components/HelpFrameSkeleton'
import { LoadingCard } from '../components/LoadingCard'
import { NotFoundPage } from '../components/NotFoundPage'
import { ProfilePage } from '../features/profile/ProfilePage'

// the help centre is its own lazy chunk: public, and never in the way of the app (spec 09)
const HelpRoutes = lazy(() => import('../features/help/HelpRoutes'))
// the help metrics page reads the help manifest, which belongs in the help chunk, not the main one
const AdminHelpMetricsPage = lazy(() =>
  import('../features/admin/AdminHelpMetricsPage').then((m) => ({
    default: m.AdminHelpMetricsPage,
  })),
)

export function App() {
  return (
    <>
      <AmbientBackground />
      <SplashGate />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/set-password" element={<SetPasswordPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/help/*"
          element={
            <Suspense fallback={<HelpFrameSkeleton />}>
              <HelpRoutes />
            </Suspense>
          }
        />
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
          <Route path="entities/new" element={<EntityFormPage />} />
          <Route path="entities/:entityId/edit" element={<EntityFormPage />} />
          <Route path="facilities" element={<FacilitiesPage />} />
          <Route path="facilities/new" element={<FacilityFormPage />} />
          <Route path="facilities/:facilityId/edit" element={<FacilityFormPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="activity/documents" element={<SourceDocumentsPage />} />
          <Route path="inventories" element={<InventoriesPage />} />
          <Route path="inventories/new" element={<InventoryFormPage />} />
          <Route path="inventories/:inventoryId" element={<InventoryDetailPage />} />
          <Route path="inventories/:inventoryId/edit" element={<InventoryFormPage />} />
          <Route path="inventories/:inventoryId/runs/:runId" element={<RunDetailPage />} />
          {/* the base year moved under Settings; the old address still lands there */}
          <Route path="base-year" element={<Navigate to="../settings/baseline" replace />} />
          <Route path="factors" element={<EmissionFactorsPage />} />
          <Route path="factor-updates" element={<FactorPackUpdatesPage />} />
          <Route path="units" element={<UnitsPage />} />
          <Route path="settings" element={<SettingsLayout />}>
            <Route index element={<OrganizationSettingsPage />} />
            <Route path="baseline" element={<BaseYearPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage inLayout />} />
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
          <Route
            path="help"
            element={
              <Suspense fallback={<LoadingCard />}>
                <AdminHelpMetricsPage />
              </Suspense>
            }
          />
          <Route path="settings" element={<AdminSettingsPage />} />
          {/* a stale bookmark lands on the dashboard rather than a blank page */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

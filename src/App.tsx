import { BrowserRouter, Routes, Route } from "react-router"
import { PortalShell } from "@/components/layout/portal-shell"
import { PORTALS } from "@/components/layout/portal-branding"

import { RequireAuth } from "@/components/auth/require-auth"

// Page imports
import HomePage from "@/portals/home/home-page"
import RegisterPage from "@/portals/auth/register-page"
import LoginPage from "@/portals/auth/login-page"
import ProfilePage from "@/portals/auth/profile-page"
import ReconciliationPage from "@/portals/auth/reconciliation-page"
import PayKadunaDashboard from "@/portals/paykaduna/dashboard-page"
import ServicesPage from "@/portals/paykaduna/services-page"
import KadVRegDashboard from "@/portals/kadvreg/dashboard-page"
import PITDashboard from "@/portals/pit/dashboard-page"
import AdminLoginPage from "@/portals/admin/admin-login-page"
import AdminOverviewPage from "@/portals/admin/overview-page"
import AdminApprovalsPage from "@/portals/admin/approvals-page"
import AdminCitizensPage from "@/portals/admin/citizens-page"
import AdminEntitiesPage from "@/portals/admin/entities-page"
import AdminTspsPage from "@/portals/admin/tsps-page"
import AdminReportsPage from "@/portals/admin/reports-page"

// Phase 11: Technical Architecture Transparency Suite
import { ArchitectureInspectorDrawer } from "@/components/inspector/architecture-inspector-drawer"
import { FloatingInspectorTrigger } from "@/components/inspector/floating-inspector-trigger"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home — no sidebar */}
        <Route element={<PortalShell portal={PORTALS.home} noSidebar />}>
          <Route index element={<HomePage />} />
        </Route>

        {/* Auth Standalone Pages — no sidebar */}
        <Route path="auth" element={<PortalShell portal={PORTALS.auth} noSidebar />}>
          <Route path="register" element={<RegisterPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="reconciliation" element={<RequireAuth><ReconciliationPage /></RequireAuth>} />
        </Route>

        {/* Profile Page with persistent citizen sidebar */}
        <Route
          path="auth/profile"
          element={
            <PortalShell portal={PORTALS.paykaduna}>
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            </PortalShell>
          }
        />

        {/* PayKaduna — with sidebar */}
        <Route path="paykaduna" element={<PortalShell portal={PORTALS.paykaduna} />}>
          <Route index element={<RequireAuth><PayKadunaDashboard /></RequireAuth>} />
          <Route path="services" element={<RequireAuth><ServicesPage /></RequireAuth>} />
          <Route path="profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        </Route>

        {/* KADVREG — Standalone External TSP Application (Distinct Revmate UI) */}
        <Route path="kadvreg" element={<KadVRegDashboard />} />
        <Route path="kadvreg/vehicles" element={<KadVRegDashboard />} />

        {/* PIT Portal — Standalone External TSP Application (Distinct e-Tax Financial UI) */}
        <Route path="pit" element={<RequireAuth><PITDashboard /></RequireAuth>} />

        {/* Admin Login — no sidebar */}
        <Route path="admin" element={<PortalShell portal={PORTALS.admin} noSidebar />}>
          <Route index element={<AdminLoginPage />} />
          <Route path="login" element={<AdminLoginPage />} />
        </Route>
        <Route path="admin" element={<PortalShell portal={PORTALS.admin} />}>
          <Route path="dashboard" element={<AdminOverviewPage />} />
          <Route path="approvals" element={<AdminApprovalsPage />} />
          <Route path="citizens" element={<AdminCitizensPage />} />
          <Route path="entities" element={<AdminEntitiesPage />} />
          <Route path="tsps" element={<AdminTspsPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="audit" element={<AdminReportsPage />} />
          <Route path="disputes" element={<AdminApprovalsPage />} />
        </Route>
      </Routes>

      {/* Global Technical Architecture Transparency Suite (Phase 11) */}
      <ArchitectureInspectorDrawer />
      <FloatingInspectorTrigger />
    </BrowserRouter>
  )
}

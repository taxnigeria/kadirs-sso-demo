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
import KadVRegDashboard from "@/portals/kadvreg/dashboard-page"
import PITDashboard from "@/portals/pit/dashboard-page"
import AdminLoginPage from "@/portals/admin/admin-login-page"
import AdminDashboard from "@/portals/admin/dashboard-page"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home — no sidebar */}
        <Route element={<PortalShell portal={PORTALS.home} noSidebar />}>
          <Route index element={<HomePage />} />
        </Route>

        {/* Auth Portal — no sidebar (registration/login are full-width) */}
        <Route path="auth" element={<PortalShell portal={PORTALS.auth} noSidebar />}>
          <Route path="register" element={<RegisterPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="reconciliation" element={<RequireAuth><ReconciliationPage /></RequireAuth>} />
        </Route>

        {/* PayKaduna — with sidebar */}
        <Route path="paykaduna" element={<PortalShell portal={PORTALS.paykaduna} />}>
          <Route index element={<RequireAuth><PayKadunaDashboard /></RequireAuth>} />
          <Route path="services" element={<RequireAuth><PayKadunaDashboard /></RequireAuth>} />
        </Route>

        {/* KADVREG — with sidebar */}
        <Route path="kadvreg" element={<PortalShell portal={PORTALS.kadvreg} />}>
          <Route index element={<RequireAuth><KadVRegDashboard /></RequireAuth>} />
        </Route>

        {/* PIT Portal — with sidebar */}
        <Route path="pit" element={<PortalShell portal={PORTALS.pit} />}>
          <Route index element={<RequireAuth><PITDashboard /></RequireAuth>} />
        </Route>

        {/* Admin — with sidebar */}
        <Route path="admin" element={<PortalShell portal={PORTALS.admin} noSidebar />}>
          <Route index element={<AdminLoginPage />} />
        </Route>
        <Route path="admin" element={<PortalShell portal={PORTALS.admin} />}>
          <Route path="dashboard" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

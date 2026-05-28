import { Route, Routes } from 'react-router-dom';
import { Providers } from './providers.js';
import { RequireAuth } from './RequireAuth.js';
import { RequireAdmin } from './RequireAdmin.js';
import { RedirectIfAuth } from './RedirectIfAuth.js';
import { LandingPage } from '../features/landing/pages/LandingPage.js';
import { NotFoundPage } from '../features/landing/pages/NotFoundPage.js';
import { LoginPage } from '../features/auth/pages/LoginPage.js';
import { RegisterPage } from '../features/auth/pages/RegisterPage.js';
import { DashboardPage } from '../features/trees/pages/DashboardPage.js';
import { TreePage } from '../features/trees/pages/TreePage.js';
import { PersonPage } from '../features/trees/pages/PersonPage.js';
import { ProfilePage } from '../features/profile/pages/ProfilePage.js';
import { VerifyEmailPage } from '../features/auth/pages/VerifyEmailPage.js';
import { AdminDashboard } from '../features/admin/pages/AdminDashboard.js';

export function App() {
  return (
    <Providers>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
        <Route path="/register" element={<RedirectIfAuth><RegisterPage /></RedirectIfAuth>} />
        <Route path="/verify" element={<VerifyEmailPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/trees/:id"
          element={
            <RequireAuth>
              <TreePage />
            </RequireAuth>
          }
        />
        <Route
          path="/persons/:id"
          element={
            <RequireAuth>
              <PersonPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Providers>
  );
}

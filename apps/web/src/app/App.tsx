import { Route, Routes } from 'react-router-dom';
import { Providers } from './providers.js';
import { RequireAuth } from './RequireAuth.js';
import { LandingPage } from '../features/landing/pages/LandingPage.js';
import { NotFoundPage } from '../features/landing/pages/NotFoundPage.js';
import { LoginPage } from '../features/auth/pages/LoginPage.js';
import { RegisterPage } from '../features/auth/pages/RegisterPage.js';
import { DashboardPage } from '../features/trees/pages/DashboardPage.js';
import { TreePage } from '../features/trees/pages/TreePage.js';
import { PersonPage } from '../features/trees/pages/PersonPage.js';
import { ProfilePage } from '../features/profile/pages/ProfilePage.js';

export function App() {
  return (
    <Providers>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
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
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Providers>
  );
}

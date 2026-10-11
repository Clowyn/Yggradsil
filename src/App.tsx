import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CampaignProvider } from './contexts/CampaignContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ArcaneLoadingFallback } from './components/common/ArcaneLoadingFallback';

// Lazy-loaded layouts for initial bundle optimization
const AppLayout = lazy(() => import('./components/layout/AppLayout').then(m => ({ default: m.AppLayout })));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));

// Lazy-loaded pages for route-based code-splitting
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const CharacterPage = lazy(() => import('./pages/CharacterPage').then(m => ({ default: m.CharacterPage })));
const SkillTreePage = lazy(() => import('./pages/SkillTreePage').then(m => ({ default: m.SkillTreePage })));
const SpellTreePage = lazy(() => import('./pages/SpellTreePage').then(m => ({ default: m.SpellTreePage })));
const MapPage = lazy(() => import('./pages/MapPage').then(m => ({ default: m.MapPage })));
const InventoryPage = lazy(() => import('./pages/InventoryPage').then(m => ({ default: m.InventoryPage })));
const GMPage = lazy(() => import('./pages/GMPage').then(m => ({ default: m.GMPage })));

// Admin Pages
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const UsersPage = lazy(() => import('./pages/admin/UsersPage').then(m => ({ default: m.UsersPage })));
const CharactersPage = lazy(() => import('./pages/admin/CharactersPage').then(m => ({ default: m.CharactersPage })));
const CampaignsPage = lazy(() => import('./pages/admin/CampaignsPage').then(m => ({ default: m.CampaignsPage })));
const ItemCatalogPage = lazy(() => import('./pages/admin/ItemCatalogPage').then(m => ({ default: m.ItemCatalogPage })));
const LogsPage = lazy(() => import('./pages/admin/LogsPage').then(m => ({ default: m.LogsPage })));

function PageFallback() {
  return <ArcaneLoadingFallback fullScreen message="COMMUNING WITH REALM..." subMessage="Attuning ancient grimoires & celestial alignments" />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CampaignProvider>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              {/* Main App Routes with Persistent Shell */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<DashboardPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/character" element={<CharacterPage />} />
                <Route path="/stat-tree" element={<SkillTreePage />} />
                <Route path="/spells" element={<SpellTreePage />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route
                  path="/gm"
                  element={
                    <ProtectedRoute requireGM>
                      <GMPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Domain Admin Routes with Persistent Admin Shell */}
              <Route
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/admin/characters" element={<CharactersPage />} />
                <Route path="/admin/campaigns" element={<CampaignsPage />} />
                <Route path="/admin/items" element={<ItemCatalogPage />} />
                <Route path="/admin/logs" element={<LogsPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </CampaignProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

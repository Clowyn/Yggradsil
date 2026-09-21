import { lazy, Suspense, useState, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CampaignProvider } from './contexts/CampaignContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AdminLayout } from './components/admin/AdminLayout';

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
  return (
    <div className="flex h-full min-h-[300px] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
        <span className="text-[11px] font-cinzel text-gold/70 tracking-widest uppercase">
          Yükleniyor...
        </span>
      </div>
    </div>
  );
}

function AppLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-abyss overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Suspense fallback={<PageFallback />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CampaignProvider>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <DashboardPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/character"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <CharacterPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stat-tree"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <SkillTreePage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/spells"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <SpellTreePage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/map"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <MapPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <InventoryPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gm"
                element={
                  <ProtectedRoute requireGM>
                    <AppLayout>
                      <GMPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Domain Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminDashboardPage />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <UsersPage />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/characters"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <CharactersPage />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/campaigns"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <CampaignsPage />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/items"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <ItemCatalogPage />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/logs"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <LogsPage />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </CampaignProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

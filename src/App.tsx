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
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
          <div className="w-4 h-4 rounded-full bg-gold/40 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-ping" />
          <span className="text-[11px] font-orbitron text-gold/80 tracking-widest uppercase">
            UPLINK_SYNCHRONIZING...
          </span>
        </div>
      </div>
    </div>
  );
}

function AppLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-abyss cyber-grid-bg overflow-hidden relative selection:bg-gold/30 selection:text-white">
      {/* Subtle top laser scanning beam */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent pointer-events-none z-50 opacity-70" />

      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <Header onToggleSidebar={() => setIsMobileOpen((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 relative">
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

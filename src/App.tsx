import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CampaignProvider } from './contexts/CampaignContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CharacterPage } from './pages/CharacterPage';
import { SkillTreePage } from './pages/SkillTreePage';
import { SpellTreePage } from './pages/SpellTreePage';
import { MapPage } from './pages/MapPage';
import { InventoryPage } from './pages/InventoryPage';
import { GMPage } from './pages/GMPage';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

import { useState } from 'react';

function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-abyss overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CampaignProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

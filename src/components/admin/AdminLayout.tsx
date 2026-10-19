import { useState, Suspense, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { Activity, Menu } from 'lucide-react';
import { ArcaneLoadingFallback } from '../common/ArcaneLoadingFallback';

interface AdminLayoutProps {
  children?: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

  return (
    <div className="flex h-dvh-screen bg-[#07080d] text-stone-100 font-sans overflow-hidden antialiased selection:bg-amber-900/40 selection:text-amber-200 relative">
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AdminSidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="h-[64px] border-b border-amber-900/30 bg-[#0a0c12]/90 backdrop-blur px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-lg bg-white/5 border border-amber-900/30 text-amber-200 hover:bg-amber-500/15 cursor-pointer"
              aria-label="Toggle Admin Navigation"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
              <span className="text-xs font-cinzel font-bold tracking-widest text-amber-200/90">
                YGGDRASIL DOMAIN MASTER
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0e1017] border border-amber-900/35 text-[11px] font-cinzel text-amber-200/80">
              <Activity size={13} className="text-emerald-400" />
              <span className="hidden sm:inline">Database Connected</span>
              <span className="sm:hidden">Online</span>
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#07080d]">
          <div className="max-w-7xl mx-auto space-y-6">
            <Suspense fallback={<ArcaneLoadingFallback message="ACCESSING ARCHIVES..." subMessage="Querying high sanctum records" />}>
              {children ?? <Outlet />}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

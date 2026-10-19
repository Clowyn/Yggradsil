import { useState, Suspense, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { FloatingDock } from './FloatingDock';
import { ArcaneLoadingFallback } from '../common/ArcaneLoadingFallback';
import { UniversalDiceTray } from '../common/UniversalDiceTray';
import { TableChatDrawer } from '../common/TableChatDrawer';

export interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh-screen bg-[#08090c] arcane-bg overflow-hidden relative selection:bg-amber-500/30 selection:text-amber-100">
      <Sidebar
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        <Header onToggleSidebar={() => setIsMobileOpen((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-6 pb-24 md:pb-28 relative">
          <Suspense fallback={<ArcaneLoadingFallback message="COMMUNING WITH REALM..." subMessage="Attuning ancient grimoires & celestial alignments" />}>
            {children ?? <Outlet />}
          </Suspense>
        </main>
        <FloatingDock />
        <UniversalDiceTray />
        <TableChatDrawer />
      </div>
    </div>
  );
}

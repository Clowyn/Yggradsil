import { type ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ArcaneLoadingFallback } from '../common/ArcaneLoadingFallback';

export function ProtectedRoute({
  children,
  requireGM = false,
  requireAdmin = false,
}: {
  children?: ReactNode;
  requireGM?: boolean;
  requireAdmin?: boolean;
}) {
  const { user, isGM, isAdmin, loading } = useAuth();

  if (loading) {
    return <ArcaneLoadingFallback fullScreen message="VERIFYING SANCTUARY..." subMessage="Attuning realm permissions" />;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;
  if (requireGM && !isGM) return <Navigate to="/" replace />;

  return children ? <>{children}</> : <Outlet />;
}

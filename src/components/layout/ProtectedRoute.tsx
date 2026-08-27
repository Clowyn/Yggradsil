import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function ProtectedRoute({
  children,
  requireGM = false,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireGM?: boolean;
  requireAdmin?: boolean;
}) {
  const { user, isGM, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-abyss">
        <div className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;
  if (requireGM && !isGM) return <Navigate to="/" replace />;

  return <>{children}</>;
}


import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, realAccessLevel, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-olive-950 flex items-center justify-center">
        <Loader2 size={32} className="text-brand-500 animate-spin" />
      </div>
    );
  }

  const localDashboardBypass = import.meta.env.VITE_LOCAL_DASHBOARD_BYPASS === 'true';

  if (!user && !localDashboardBypass) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Use realAccessLevel (not the test-mode override) so an admin testing Free tier
  // still keeps access to /admin routes.
  if (requireAdmin && realAccessLevel !== 'admin' && !localDashboardBypass) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

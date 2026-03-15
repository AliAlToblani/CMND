import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const LoadingSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="space-y-4 w-full max-w-md">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, profile, loading: authLoading, profileLoading } = useAuth();
  const location = useLocation();

  if (authLoading || (user && profileLoading)) {
    return <LoadingSkeleton />;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Batelco users can ONLY access /batelco/*; normal users can access both
  const isBatelcoUser = profile?.role === 'batelco';
  const isOnBatelcoRoute = location.pathname.startsWith('/batelco');
  if (isBatelcoUser && !isOnBatelcoRoute) {
    return <Navigate to="/batelco" replace />;
  }

  return <>{children}</>;
};
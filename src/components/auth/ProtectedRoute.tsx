import { Navigate, useLocation } from 'react-router';
import { useAuthStore } from '../../store/authStore';
import { useEffect, useState } from 'react';
import { authService } from '../../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserTypes?: ('host' | 'admin')[];
  requireApproved?: boolean;
}

export default function ProtectedRoute({
  children,
  allowedUserTypes = ['host', 'admin'],
  requireApproved = true
}: ProtectedRouteProps) {
  const { isAuthenticated, user, token, logout, login, setLoading } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      if (token && !user) {
        try {
          const response = await authService.getMe();
          if (response.success && response.data) {
            login(token, response.data);
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }
      setIsVerifying(false);
      setLoading(false);
    };

    verifyAuth();
  }, [token, user, login, logout, setLoading]);

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (requireApproved && user.status !== 'approved' && user.userType === 'host') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md text-center shadow-lg">
          <div className="text-warning-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Account Pending Approval</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your account is currently {user.status}. Please wait for admin approval to access the dashboard.
          </p>
          <button
            onClick={logout}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  if (!allowedUserTypes.includes(user.userType)) {
    const redirectPath = user.userType === 'admin' ? '/admin' : '/host';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}


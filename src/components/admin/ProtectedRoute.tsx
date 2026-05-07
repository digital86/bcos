import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && session.user) {
          const userEmail = session.user.email;
        const allowedEmails = ['aminekerkarr@gmail.com', 'digital@bcos-dz.com'];
          
          if (userEmail && allowedEmails.includes(userEmail)) {
            setAuthenticated(true);
          } else {
            // Not in whitelist, sign out
            await supabase.auth.signOut();
            setAuthenticated(false);
            window.location.href = '/admin/login?error=access_denied';
          }
        } else {
          setAuthenticated(false);
        }
      } catch (error) {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session && session.user) {
        const userEmail = session.user.email;
        const allowedEmails = ['aminekerkarr@gmail.com', 'digital@bcos-dz.com'];
        
        if (userEmail && allowedEmails.includes(userEmail)) {
          setAuthenticated(true);
        } else {
          await supabase.auth.signOut();
          setAuthenticated(false);
        }
      } else {
        setAuthenticated(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

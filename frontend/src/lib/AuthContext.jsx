import React, { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const publicDisplay = window.location.hash.startsWith('#/display');
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(!publicDisplay);
  const [authError, setAuthError] = useState(null);

  const checkAppState = async () => {
    if (publicDisplay) { setIsLoadingAuth(false); setAuthError(null); return; }
    setIsLoadingAuth(true);
    try { setUser(await base44.auth.me()); setAuthError(null); }
    catch (error) { setUser(null); setAuthError({ type: 'auth_required', message: error.message }); }
    finally { setIsLoadingAuth(false); }
  };

  useEffect(() => { void checkAppState(); }, []);

  return <AuthContext.Provider value={{
    user, isAuthenticated: Boolean(user), isLoadingAuth, isLoadingPublicSettings: false,
    authError, appPublicSettings: { public: true }, logout: () => base44.auth.logout(),
    navigateToLogin: () => base44.auth.redirectToLogin(), checkAppState,
  }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

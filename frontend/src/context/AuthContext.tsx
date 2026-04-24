import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { AuthContextType, AuthTokens, DecodedToken, LoginProps, RegisterProps } from '.';
import { createHttpClient } from '../services/http';
import { createAuthService } from '../services/auth.service';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authTokens, setAuthTokens] = useState<AuthTokens | null>(() => {
    const tokens = localStorage.getItem('authTokens');
    return tokens ? JSON.parse(tokens) : null;
  });

  const navigate = useNavigate();

  const [user, setUser] = useState<DecodedToken | null>(() => {
    const tokens = localStorage.getItem("authTokens");
    if (!tokens) return null;

    try {
      const parsed = JSON.parse(tokens);
      return jwtDecode(parsed.access);
    } catch {
      return null;
    }
  });

  const logoutUser = useCallback(() => {
    setAuthTokens(null);
    setUser(null);
    localStorage.removeItem('authTokens');
    requestAnimationFrame(() => {
      navigate('/ingresar');
    });
  }, [navigate]);

  const handleUnauthorized = useCallback(() => {
    logoutUser();
    navigate("/ingresar", { replace: true });
  }, [logoutUser, navigate]);

  const urlBackend = import.meta.env.VITE_API_URL;
  const authService = useMemo(() => {

    const http = createHttpClient({
      apiUrl: urlBackend,
      tokens: authTokens,
      onUnauthorized: handleUnauthorized
    });

    return createAuthService(http);

  }, [authTokens, handleUnauthorized, urlBackend]);

  const loginUser = async (formData: LoginProps) => {
    try {
      const tokens = await authService.loginUser(formData);
      setAuthTokens(tokens);
      setUser(jwtDecode(tokens.access));

      localStorage.setItem("authTokens", JSON.stringify(tokens));

    } catch (error) {
        console.error(error)
        throw error
    }
  };

  const registerUser = async (formData: RegisterProps) => {
    try {
      await authService.registerUser(formData);
    } catch (error) {
        console.error(error)
        throw error
    }
  };
  
  useEffect(() => {
    if (!authTokens) return;

    const decoded: DecodedToken = jwtDecode(authTokens.access);
    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();

    const timeout = expirationTime - currentTime;

    if (timeout <= 0) {
      logoutUser();
      return;
    }

    const timer = setTimeout(() => {
      logoutUser();
    }, timeout);

    return () => clearTimeout(timer);
  }, [authTokens, logoutUser]);
  
  return (
    <AuthContext.Provider value={{
      user,
      authTokens,
      loginUser,
      registerUser,
      handleUnauthorized,
      logoutUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
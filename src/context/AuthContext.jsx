import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams, useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('conres_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.expiresAt && new Date(userData.expiresAt) > new Date()) {
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('conres_user');
        }
      } catch (e) {
        localStorage.removeItem('conres_user');
      }
    }
    setIsLoading(false);
  }, []);

  const loginWithPin = async (pin) => {
    try {
      const { data, error } = await supabase.rpc('validate_pin', { input_pin: pin });

      if (error) {
        console.error('PIN validation error:', error);
        return { success: false, error: 'Login failed' };
      }

      if (!data?.success) {
        return { success: false, error: data?.error || 'Invalid PIN' };
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const userData = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        expiresAt: expiresAt.toISOString()
      };

      localStorage.setItem('conres_user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  };

  const loginWithToken = async (token, moduleSlug = 'couples-communication') => {
    try {
      const response = await fetch(
        `https://couples.integrativepsychiatry.xyz/api/modules/validate-token?token=${encodeURIComponent(token)}&module=${encodeURIComponent(moduleSlug)}`
      );

      if (!response.ok) {
        return { success: false, error: 'Token validation failed' };
      }

      const result = await response.json();

      if (!result.valid) {
        return { success: false, error: result.message || 'Invalid or expired token' };
      }

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      const userData = {
        id: result.userId || result.user_id || 'token_user',
        name: result.name || result.userName || 'User',
        email: result.email || null,
        role: result.role || 'user',
        isTokenAuth: true,
        expiresAt: expiresAt.toISOString()
      };

      localStorage.setItem('conres_user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Token validation error:', error);
      return { success: false, error: 'Token validation failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('conres_user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    loginWithPin,
    loginWithToken,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const TokenHandler = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { loginWithToken, isAuthenticated } = useAuth();
  const [isValidating, setIsValidating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token && !isAuthenticated && !isValidating) {
      setIsValidating(true);
      
      loginWithToken(token).then((result) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('token');
        setSearchParams(newParams, { replace: true });
        
        if (!result.success) {
          navigate('/login?error=invalid_token');
        }
        setIsValidating(false);
      });
    }
  }, [searchParams, isAuthenticated, isValidating, loginWithToken, setSearchParams, navigate]);

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Validating access...</p>
        </div>
      </div>
    );
  }

  return children;
};

export default AuthContext;

// contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authservice.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        const storedToken = authService.getToken();
        const storedUser = authService.getCurrentUser();

        if (storedToken && storedUser) {
          // Optionally verify token with backend
          const isValid = await authService.verifyToken();
          
          if (isValid) {
            setToken(storedToken);
            setUser(storedUser);
            setIsAuthenticated(true);
          } else {
            // Token is invalid, clear everything
            clearAuth();
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Clear authentication state
  const clearAuth = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        setToken(response.data.token);
        setIsAuthenticated(true);
      }
      
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      clearAuth();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authService.login(credentials);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        setToken(response.data.token);
        setIsAuthenticated(true);
      }
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      clearAuth();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      clearAuth();
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, clear local state
      clearAuth();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update user data (useful for profile updates)
  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Check authentication status
  const checkAuth = () => {
    const currentToken = authService.getToken();
    const currentUser = authService.getCurrentUser();
    const authStatus = !!(currentToken && currentUser);
    
    if (authStatus !== isAuthenticated) {
      setIsAuthenticated(authStatus);
      if (!authStatus) {
        clearAuth();
      }
    }
    
    return authStatus;
  };

  const contextValue = {
    // State
    user,
    token,
    loading,
    isAuthenticated,
    
    // Actions
    register,
    login,
    logout,
    updateUser,
    checkAuth,
    clearAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
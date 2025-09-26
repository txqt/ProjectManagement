import React, { useState, useEffect } from 'react';
import { apiService } from '~/services/api';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const savedToken = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (savedToken && userData) {
      try {
        setUser(JSON.parse(userData));
        setToken(savedToken);
        apiService.setAuthToken(savedToken);
      } catch (error) {
        console.error('Error parsing user data:', error);
        logout();
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await apiService.login(credentials);
      const { token: newToken, user: userData } = response;
      
      setUser(userData);
      setToken(newToken);
      apiService.setAuthToken(newToken);
      localStorage.setItem('authToken', newToken);
      localStorage.setItem('userData', JSON.stringify(userData));
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData);
      const { token: newToken, user: newUser } = response;
      
      setUser(newUser);
      setToken(newToken);
      apiService.setAuthToken(newToken);
      localStorage.setItem('authToken', newToken);
      localStorage.setItem('userData', JSON.stringify(newUser));
      
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    apiService.setAuthToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

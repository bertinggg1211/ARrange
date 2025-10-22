import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/api';

// Create the AuthContext
const AuthContext = createContext();

// Custom hook to use the AuthContext
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkUserLoggedIn = async () => {
      try {
        // Set to false to always show onboarding first
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        const userData = await AsyncStorage.getItem('userData');
        const storedToken = await AsyncStorage.getItem('authToken');
        
        if (userData) {
          // One-time normalization/migration for stored user data
          const parsed = JSON.parse(userData);
          const normalized = {
            ...parsed,
            email: (parsed?.email || '').trim().toLowerCase(),
          };
          const changed = JSON.stringify(parsed) !== JSON.stringify(normalized);
          if (changed) {
            await AsyncStorage.setItem('userData', JSON.stringify(normalized));
          }
          if (hasSeenOnboarding === 'true' && storedToken) {
            try {
              // Validate token and refresh user from server
              const meResp = await authApi.me(storedToken);
              const refreshedUser = meResp.user || normalized;
              await AsyncStorage.setItem('userData', JSON.stringify(refreshedUser));
              setUser(refreshedUser);
              setToken(storedToken);
            } catch (e) {
              await AsyncStorage.removeItem('authToken');
            }
          }
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserLoggedIn();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const resp = await authApi.login({ email, password });
      const { token: jwt, user: serverUser } = resp;
      await AsyncStorage.setItem('authToken', jwt);
      await AsyncStorage.setItem('userData', JSON.stringify(serverUser));
      setUser(serverUser);
      setToken(jwt);
      return serverUser;
    } catch (error) {
      throw error;
    }
  };

  // Signup function
  const signup = async (userData) => {
    try {
      const resp = await authApi.signup(userData);
      const { token: jwt, user: serverUser } = resp;
      await AsyncStorage.setItem('authToken', jwt);
      await AsyncStorage.setItem('userData', JSON.stringify(serverUser));
      setUser(serverUser);
      setToken(jwt);
      return serverUser;
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('Starting logout process...');
      
      // Clear authentication token
      await AsyncStorage.removeItem('authToken');
      
      // Clear user data (complete logout)
      await AsyncStorage.removeItem('userData');
      
      // Clear all app-specific data (but keep hasSeenOnboarding)
      await AsyncStorage.multiRemove([
        'cartData', 
        'likesData', 
        'chatData'
      ]);
      
      // Reset state
      setUser(null);
      setToken(null);
      
      console.log('Logout completed successfully');
      
      // Force a small delay to ensure state updates propagate
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return { success: true };
    } catch (error) {
      console.error('Error during logout:', error);
      throw new Error('Failed to logout. Please try again.');
    }
  };

  // Update user data
  const updateUser = async (updatedData) => {
    try {
      const newUserData = { ...user, ...updatedData };
      await AsyncStorage.setItem('userData', JSON.stringify(newUserData));
      setUser(newUserData);
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        updateUser,
        isAuthenticated: !!user,
        userType: user?.role || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
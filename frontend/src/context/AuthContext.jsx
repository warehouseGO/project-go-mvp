import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../utils/api";
import {
  setToken,
  getToken,
  removeToken,
  setUser,
  getUser,
  removeUser,
} from "../utils/auth";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const response = await authAPI.me();
          setUserState(response.data);
          setUser(response.data);
        } catch (error) {
          console.error("Failed to get user data:", error);
          removeToken();
          removeUser();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token } = response.data;
      setToken(token);

      // Get user data
      const userResponse = await authAPI.me();
      setUserState(userResponse.data);
      setUser(userResponse.data);
      console.log(userResponse.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Login failed",
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Registration failed",
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      removeToken();
      removeUser();
      setUserState(null);
    }
  };

  const hasRole = (role) => {
    if (!user || !user.role) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  const getUserRole = () => {
    if (!user || !user.role) return null;
    return user.role;
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    hasRole,
    getUserRole,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ═══════════════════════════════════════════════════════════════════
//  AuthContext.js — Context global d'authentification
//  Converti depuis TypeScript → JavaScript (React Native / Expo)
//  localStorage → AsyncStorage
// ═══════════════════════════════════════════════════════════════════

import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';

// ─── Création du Context ─────────────────────────────────────────────
export const AuthContext = createContext(undefined);

// ─── Provider ────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Initialiser depuis AsyncStorage au montage ────────────────────
  // (équivalent de localStorage dans la version TypeScript originale)
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = await authService.getToken();
      const storedUser = await authService.getUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser({
          id: storedUser.id,
          firstName: storedUser.firstName,
          lastName: storedUser.lastName,
          email: storedUser.email,
          role: storedUser.role, // 'Admin' | 'Occupant'
          isActive: storedUser.isActive,
          phoneNumber: storedUser.phoneNumber,
        });
        setIsAuthenticated(true);
      }
    };

    initializeAuth();
  }, []);

  // ── Login ─────────────────────────────────────────────────────────
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login({ email, password });

      if (!response.success) {
        setError(response.error);
        return { success: false, error: response.error };
      }

      if (response.token && response.user) {
        setToken(response.token);
        setUser({
          id: response.user.id,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          email: response.user.email,
          role: response.user.role,
          isActive: response.user.isActive,
          phoneNumber: response.user.phoneNumber,
        });
        setIsAuthenticated(true);
      }

      return { success: true };
    } catch (err) {
      const msg = err?.message || 'Connexion échouée. Réessayez.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  // ── Register ──────────────────────────────────────────────────────
  const register = async (payload) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(payload);

      if (!response.success) {
        setError(response.error);
        return { success: false, error: response.error };
      }

      // Inscription réussie → ne pas connecter automatiquement
      // (compte Occupant attend validation admin)
      return { success: true, data: response.data };
    } catch (err) {
      const msg = err?.message || 'Inscription échouée. Réessayez.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  // ── Logout ────────────────────────────────────────────────────────
  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setError(null);
  };

  // ── Valeur exposée dans tout l'arbre ──────────────────────────────
  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook custom ─────────────────────────────────────────────────────
/**
 * Usage dans n'importe quel composant:
 *   const { user, login, logout, register, isAuthenticated } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuth() doit être utilisé à l'intérieur d'un <AuthProvider>"
    );
  }
  return context;
};

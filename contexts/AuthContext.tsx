
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, updateAppSettings as updateDexieAppSettings, AppSettingsDexie } from '../db'; 
import { User, ViewMode, UserRole } from '../types';
import { useLiveQuery } from 'dexie-react-hooks';


interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (username: string, passwordAttempt: string) => Promise<void>;
  logout: () => void;
  registerUser: (username: string, password: string, role: UserRole, permissions: ViewMode[]) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  updateUserCredentials: (userId: string, newUsername?: string, newPassword?: string) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  updateUserPermissions: (userId: string, permissions: ViewMode[]) => Promise<void>;
  users: User[];
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

    const users = useLiveQuery(() => db.users.toArray());
    const liveAppSettings = useLiveQuery(() => db.appSettings.get(0));
  
  const [stableAppSettings, setStableAppSettings] = useState<AppSettingsDexie | undefined>(undefined);

  useEffect(() => {
    if (liveAppSettings !== undefined) {
      setStableAppSettings(liveAppSettings);
    }
  }, [liveAppSettings]);

  const fetchUser = useCallback(async () => {
    console.log("AuthContext: Fetching user...");
    // Wait until settings are actually loaded from DB
    if (liveAppSettings === undefined) {
        console.log("AuthContext: liveAppSettings is undefined, waiting...");
        return;
    }

    if (stableAppSettings && stableAppSettings.currentUserId) {
        console.log(`AuthContext: Found currentUserId ${stableAppSettings.currentUserId}`);
        try {
            const userFromDb = await db.users.get(stableAppSettings.currentUserId);
            if (userFromDb) {
              console.log("AuthContext: User found in DB");
              const { password, ...userWithoutPassword } = userFromDb;
              setCurrentUser({ ...userWithoutPassword, role: userFromDb.role, permissions: userFromDb.permissions || [] });
            } else {
              console.warn("AuthContext: User not found in DB, resetting...");
              setCurrentUser(null);
              await updateDexieAppSettings({ currentUserId: null });
            }
        } catch (e) {
            console.error("AuthContext: Error fetching user:", e);
            setCurrentUser(null);
        }
    } else {
        console.log("AuthContext: No currentUserId found");
        setCurrentUser(null);
    }
    setIsLoadingAuth(false);
  }, [stableAppSettings, liveAppSettings]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Safety timeout to ensure app doesn't stay stuck in loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoadingAuth) {
        console.warn("AuthContext: Safety timeout triggered! Forcing isLoadingAuth to false.");
        setIsLoadingAuth(false);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [isLoadingAuth]);

  const login = useCallback(async (username: string, passwordAttempt: string): Promise<void> => {
    setIsLoadingAuth(true);
    setError(null);
    try {
      const trimmedUsername = username.trim();
      // Direct query to ensure we get latest data
      let user = await db.users.where('username').equalsIgnoreCase(trimmedUsername).first();

      // Fallback: if no users exist at all, try to re-seed and check again
      if (!user) {
        const userCount = await db.users.count();
        if (userCount === 0) {
            await db.seed();
            user = await db.users.where('username').equalsIgnoreCase(trimmedUsername).first();
        }
      }

      if (user && user.password === passwordAttempt) {
        const { password, ...userWithoutPassword } = user;
        setCurrentUser({ ...userWithoutPassword, role: user.role, permissions: user.permissions || [] });
        await updateDexieAppSettings({ currentUserId: user.id });
      } else {
        setError('ইউজারনেম বা পাসওয়ার্ড সঠিক নয়।');
        throw new Error('Invalid credentials');
      }
    } catch (e) {
        console.error("Login error:", e);
        throw e;
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  const registerUser = useCallback(async (username: string, password: string, role: UserRole, permissions: ViewMode[]): Promise<void> => {
    const existing = await db.users.where('username').equalsIgnoreCase(username.trim()).first();
    if (existing) throw new Error(`User "${username}" already exists.`);
    await db.users.add({ id: crypto.randomUUID(), username: username.trim(), password, role, permissions });
  }, []);

  const logout = useCallback(async () => {
    setCurrentUser(null);
    await updateDexieAppSettings({ currentUserId: null });
  }, []);

  const deleteUser = useCallback(async (userId: string) => {
    if (currentUser?.id === userId) throw new Error("নিজের অ্যাকাউন্ট মুছে ফেলা সম্ভব নয়।");
    await db.users.delete(userId);
  }, [currentUser]);

  const updateUserCredentials = useCallback(async (userId: string, newUsername?: string, newPassword?: string) => {
    const updates: any = {};
    if (newUsername) updates.username = newUsername.trim();
    if (newPassword) updates.password = newPassword;
    await db.users.update(userId, updates);
    if (currentUser?.id === userId && newUsername) {
        setCurrentUser(prev => prev ? { ...prev, username: newUsername } : null);
    }
  }, [currentUser]);

  const updateUserRole = useCallback(async (userId: string, role: UserRole) => {
    await db.users.update(userId, { role });
  }, []);

  const updateUserPermissions = useCallback(async (userId: string, permissions: ViewMode[]) => {
    await db.users.update(userId, { permissions });
  }, []);

  const contextValue: AuthContextValue = {
    isAuthenticated: !!currentUser,
    currentUser,
    isLoading: isLoadingAuth,
    error,
    login,
    logout,
    registerUser,
    deleteUser,
    updateUserCredentials,
    updateUserRole,
    updateUserPermissions,
    users: users || [],
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

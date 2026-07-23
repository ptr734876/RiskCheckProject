import { create } from 'zustand';
import type { User } from '@/types';
import { authApi } from '@/api';
import { apiErrorMessage, mapBackendUser } from '@/api/mappers';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBootstrapping: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isBootstrapping: true,
  error: null,

  bootstrap: async () => {
    set({ isBootstrapping: true, error: null });
    try {
      const { data } = await authApi.getCurrentUser();
      if (data.authenticated && data.user) {
        set({
          user: mapBackendUser(data.user),
          isAuthenticated: true,
          isBootstrapping: false,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isBootstrapping: false,
        });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isBootstrapping: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.login(email, password);
      set({
        user: mapBackendUser(data.user),
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: apiErrorMessage(error, 'Ошибка входа'),
      });
      throw error;
    }
  },

  register: async (fullName, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.register(fullName, email, password);
      set({
        user: mapBackendUser(data.user),
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: apiErrorMessage(error, 'Ошибка регистрации'),
      });
      throw error;
    }
  },

  loginAsGuest: async () => {
    try {
      await authApi.guestLogin();
    } catch {
      // гостевой режим работает и без ответа сервера
    }
    set({
      user: {
        id: 'guest',
        email: '',
        fullName: 'Гость',
        isAuthenticated: false,
        isGuest: true,
      },
      isAuthenticated: false,
      error: null,
    });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
    }
    set({ user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));

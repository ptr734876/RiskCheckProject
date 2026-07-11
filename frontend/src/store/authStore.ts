import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  loginAsGuest: () => void;
  logout: () => void;
  clearError: () => void;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      await delay(800);
      if (!email.includes('@')) throw new Error('Некорректный email');
      if (password.length < 6) throw new Error('Пароль должен быть не менее 6 символов');
      
      set({
        user: {
          id: 'user_' + Math.random().toString(36).substr(2, 9),
          email,
          fullName: email.split('@')[0],
          isAuthenticated: true,
          isGuest: false,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Ошибка входа' });
      throw error;
    }
  },

  register: async (fullName, email, password) => {
    set({ isLoading: true, error: null });
    try {
      await delay(1000);
      if (!fullName.trim()) throw new Error('Введите ФИО');
      if (!email.includes('@')) throw new Error('Некорректный email');
      if (password.length < 6) throw new Error('Пароль должен быть не менее 6 символов');
      
      set({
        user: {
          id: 'user_' + Math.random().toString(36).substr(2, 9),
          email,
          fullName,
          isAuthenticated: true,
          isGuest: false,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Ошибка регистрации' });
      throw error;
    }
  },

  loginAsGuest: () => set({
    user: {
      id: 'guest',
      email: '',
      fullName: 'Гость',
      isAuthenticated: false,
      isGuest: true,
    },
    isAuthenticated: false,
    error: null,
  }),

  logout: () => set({ user: null, isAuthenticated: false, error: null }),
  clearError: () => set({ error: null }),
}));
// src/store/authStore.js
import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isGuest: false,
  guestName: '',
  
  setUser: (user) => set({ 
    user,
    isAuthenticated: !!user,
    isGuest: false
  }),
  
  setGuestUser: (name) => set({
    user: null,
    isAuthenticated: false,
    isGuest: true,
    guestName: name
  }),
  
  logout: () => set({
    user: null,
    isAuthenticated: false,
    isGuest: false,
    guestName: ''
  }),

  // Método para actualizar datos específicos del usuario
  updateUserData: (userData) => set(state => ({
    user: { ...state.user, ...userData }
  }))
}));

export default useAuthStore;
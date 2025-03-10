// src/store/contentStore.js
import { create } from 'zustand';

const useContentStore = create((set) => ({
  books: [],
  currentBook: null,
  exercises: [],
  loading: false,
  error: null,
  
  setBooks: (books) => set({ books }),
  setCurrentBook: (book) => set({ currentBook: book }),
  setExercises: (exercises) => set({ exercises }),
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null })
}));

export default useContentStore;
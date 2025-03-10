// src/store/progressStore.js
import { create } from 'zustand';

const useProgressStore = create((set, get) => ({
  readingProgress: {},
  exerciseProgress: {},
  verbalFluencyProgress: {},
  medals: [],
  
  updateReadingProgress: (bookId, progress) => set({
    readingProgress: {
      ...get().readingProgress,
      [bookId]: progress
    }
  }),
  
  updateExerciseProgress: (exerciseId, score) => set({
    exerciseProgress: {
      ...get().exerciseProgress,
      [exerciseId]: score
    }
  }),
  
  updateVerbalFluencyProgress: (exerciseId, score) => set({
    verbalFluencyProgress: {
      ...get().verbalFluencyProgress,
      [exerciseId]: score
    }
  }),
  
  addMedal: (medal) => set({
    medals: [...get().medals, medal]
  }),
  
  clearProgress: () => set({
    readingProgress: {},
    exerciseProgress: {},
    verbalFluencyProgress: {},
    medals: []
  })
}));

export default useProgressStore;
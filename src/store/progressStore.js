// src/store/progressStore.js
import { create } from 'zustand';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

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
  
  // Reemplazar todas las medallas (para sincronización)
  setMedals: (medals) => set({
    medals: medals
  }),
  
  // Sincronizar con Firestore (para usuarios autenticados)
  syncMedalsWithFirestore: async (userId) => {
    try {
      if (!userId) return;
      
      const currentMedals = get().medals;
      
      // Guardar cada medalla en Firestore
      for (const medal of currentMedals) {
        await setDoc(doc(db, 'users', userId, 'medals', medal.id), {
          ...medal,
          syncedAt: new Date().toISOString()
        }, { merge: true });
      }
      
      // Actualizar el contador de medallas
      await setDoc(doc(db, 'users', userId, 'stats', 'medals'), {
        count: currentMedals.length,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      return true;
    } catch (error) {
      console.error("Error syncing medals:", error);
      return false;
    }
  },
  
  clearProgress: () => set({
    readingProgress: {},
    exerciseProgress: {},
    verbalFluencyProgress: {},
    medals: []
  })
}));

export default useProgressStore;
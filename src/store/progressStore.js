// src/store/progressStore.js
import { create } from 'zustand';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
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
  
  addMedal: (medal) => {
    const currentMedals = get().medals;
    // Verificar si la medalla ya existe antes de agregarla
    const medalExists = currentMedals.some(m => m.id === medal.id);
    if (!medalExists) {
      set({
        medals: [...currentMedals, medal]
      });
    }
  },
  
  // Reemplazar todas las medallas (para sincronización)
  setMedals: (medals) => set({
    medals: medals
  }),
  
  // Sincronizar con Firestore (para usuarios autenticados)
  loadMedalsFromFirestore: async (userId) => {
    try {
      if (!userId) return [];
      
      const medalsCollection = collection(db, 'users', userId, 'medals');
      const medalsSnapshot = await getDocs(medalsCollection);
      
      if (!medalsSnapshot.empty) {
        const loadedMedals = medalsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        set({ medals: loadedMedals });
        return loadedMedals;
      }
      return [];
    } catch (error) {
      console.error("Error loading medals:", error);
      return [];
    }
  },
  
  loadMedalsFromFirestore: async (userId) => {
    try {
      if (!userId) return [];
      
      const medalsCollection = collection(db, 'users', userId, 'medals');
      const medalsSnapshot = await getDocs(medalsCollection);
      
      if (!medalsSnapshot.empty) {
        const loadedMedals = medalsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        set({ medals: loadedMedals });
        return loadedMedals;
      }
      return [];
    } catch (error) {
      console.error("Error loading medals:", error);
      return [];
    }
  },
  
  syncMedalsWithFirestore: async (userId) => {
    try {
      if (!userId) return;
      
      const currentMedals = get().medals;
      
      // Guardar cada medalla en Firestore
      const promises = currentMedals.map(medal => 
        setDoc(doc(db, 'users', userId, 'medals', medal.id), {
          ...medal,
          syncedAt: new Date().toISOString()
        }, { merge: true })
      );
      
      await Promise.all(promises);
      
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
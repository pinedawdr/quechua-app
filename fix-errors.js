// fix-errors-corrected.js
const fs = require('fs');
const path = require('path');

// Rutas a los archivos que necesitan corrección
const progressStorePath = path.join(__dirname, 'src/store/progressStore.js');
const profileScreenPath = path.join(__dirname, 'src/screens/ProfileScreen.js');
const progressScreenPath = path.join(__dirname, 'src/screens/ProgressScreen.js');

// Corregir progressStore.js
let progressStoreContent = fs.readFileSync(progressStorePath, 'utf8');
progressStoreContent = progressStoreContent.replace(
  `addMedal: (medal) => set({
    medals: [...get().medals, medal]
  }),`,
  `addMedal: (medal) => {
    const currentMedals = get().medals;
    // Verificar si la medalla ya existe antes de agregarla
    const medalExists = currentMedals.some(m => m.id === medal.id);
    if (!medalExists) {
      set({
        medals: [...currentMedals, medal]
      });
    }
  },`
);

// Agregar la función loadMedalsFromFirestore
progressStoreContent = progressStoreContent.replace(
  `syncMedalsWithFirestore: async (userId) => {`,
  `loadMedalsFromFirestore: async (userId) => {
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
  
  syncMedalsWithFirestore: async (userId) => {`
);

// Mejorar la función syncMedalsWithFirestore
progressStoreContent = progressStoreContent.replace(
  `// Guardar cada medalla en Firestore
      for (const medal of currentMedals) {
        await setDoc(doc(db, 'users', userId, 'medals', medal.id), {
          ...medal,
          syncedAt: new Date().toISOString()
        }, { merge: true });
      }`,
  `// Guardar cada medalla en Firestore
      const promises = currentMedals.map(medal => 
        setDoc(doc(db, 'users', userId, 'medals', medal.id), {
          ...medal,
          syncedAt: new Date().toISOString()
        }, { merge: true })
      );
      
      await Promise.all(promises);`
);

// Actualizar las importaciones en progressStore.js
progressStoreContent = progressStoreContent.replace(
  `import { doc, setDoc } from 'firebase/firestore';`,
  `import { doc, setDoc, collection, getDocs } from 'firebase/firestore';`
);

// Guardar cambios en progressStore.js
fs.writeFileSync(progressStorePath, progressStoreContent);
console.log('✅ progressStore.js actualizado correctamente');

// Corregir ProfileScreen.js - En lugar de usar una expresión regular compleja, vamos a hacer cambios específicos
let profileScreenContent = fs.readFileSync(profileScreenPath, 'utf8');

// Primero, agregar la importación de updateDoc si no existe
if (!profileScreenContent.includes('import { doc, updateDoc')) {
  profileScreenContent = profileScreenContent.replace(
    'import { doc, updateDoc, getDoc, setDoc, collection, getDocs, deleteDoc } from \'firebase/firestore\';',
    'import { doc, updateDoc, getDoc, setDoc, collection, getDocs, deleteDoc } from \'firebase/firestore\';'
  );
  
  if (!profileScreenContent.includes('updateDoc')) {
    profileScreenContent = profileScreenContent.replace(
      'import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from \'firebase/firestore\';',
      'import { doc, updateDoc, getDoc, setDoc, collection, getDocs, deleteDoc } from \'firebase/firestore\';'
    );
  }
}

// Modificar la función loadProfileData
// Añadimos código para actualizar el nivel correctamente
profileScreenContent = profileScreenContent.replace(
  /const loadProfileData = async \(\) => {[\s\S]*?const userLevel = calculateUserLevel\(localMedals\);[\s\S]*?setLevel\(getLevelLabel\(calculatedLevel\)\);/,
  `const loadProfileData = async () => {
    if (!isGuest && user) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setInstitution(userData.institution || '');
          setNotifications(userData.notifications !== undefined ? userData.notifications : true);
          // Cargar la foto de perfil si existe
          if (userData.profileImage) {
            setProfileImage(userData.profileImage);
          }
          
          // Si el usuario tiene un nivel definido, actualizar el estado local
          if (userData.level) {
            setLevel(userData.level);
          }
        }
        
        // Contar actividades de lectura completadas
        const readingQuery = collection(db, 'users', user.uid, 'reading');
        const readingSnapshot = await getDocs(readingQuery);
        const readingCount = readingSnapshot.size;
        
        // Contar quizzes completados
        const quizzesQuery = collection(db, 'users', user.uid, 'quizzes');
        const quizzesSnapshot = await getDocs(quizzesQuery);
        const quizzesCount = quizzesSnapshot.size;
        
        // Contar ejercicios verbales completados
        const verbalQuery = collection(db, 'users', user.uid, 'verbalExercises');
        const verbalSnapshot = await getDocs(verbalQuery);
        const verbalCount = verbalSnapshot.size;
        
        // Actualizar estadísticas
        const totalCompleted = readingCount + quizzesCount + verbalCount;
        const estimatedMinutes = totalCompleted * 5; // Estimación básica de minutos
        
        setProfileStats({
          booksRead: readingCount,
          exercisesCompleted: quizzesCount + verbalCount,
          totalMinutes: estimatedMinutes
        });
        
        // Actualizar en Firestore
        await setDoc(doc(db, 'users', user.uid, 'stats', 'overview'), {
          booksRead: readingCount,
          exercisesCompleted: quizzesCount + verbalCount,
          totalMinutes: estimatedMinutes,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        
        // Cargar medallas del usuario con lógica mejorada
        const medalsQuery = await getDoc(doc(db, 'users', user.uid, 'stats', 'medals'));
        if (medalsQuery.exists()) {
          const medalCount = medalsQuery.data().count || 0;
          setUserMedals(medalCount);
          
          // Calcular nivel basado en medallas
          const calculatedLevel = calculateUserLevel(medalCount);
          setUserLevel(calculatedLevel);
          
          // Actualizar el nivel en el estado local
          const levelLabel = getLevelLabel(calculatedLevel);
          setLevel(levelLabel);
          
          // Guardar el nivel actualizado en Firestore
          try {
            await updateDoc(doc(db, 'users', user.uid), {
              level: levelLabel,
              updatedAt: new Date().toISOString()
            });
          } catch (updateError) {
            console.error('Error updating user level:', updateError);
          }
        } else {
          // Si no hay documento de medallas, usar las medallas locales
          const localMedals = medals.length;
          setUserMedals(localMedals);
          
          // Calcular nivel basado en medallas
          const calculatedLevel = calculateUserLevel(localMedals);
          setUserLevel(calculatedLevel);
          setLevel(getLevelLabel(calculatedLevel));
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    } else {
      // Para modo invitado, usar datos locales
      const localMedals = medals.length;
      setUserMedals(localMedals);
      
      // Calcular nivel basado en medallas
      const calculatedLevel = calculateUserLevel(localMedals);
      setUserLevel(calculatedLevel);
      setLevel(getLevelLabel(calculatedLevel));`
);

// Corregir la función handleResetProgress
profileScreenContent = profileScreenContent.replace(
  /const handleResetProgress = \(\) => {[\s\S]*?Alert\.alert\([\s\S]*?"Restablecer progreso"[\s\S]*?[\s\S]*?onPress: async \(\) => {[\s\S]*?clearProgress\(\);[\s\S]*?setLevel\('Principiante'\);/,
  `const handleResetProgress = () => {
    Alert.alert(
      "Restablecer progreso",
      "¿Estás seguro de que deseas restablecer todo tu progreso? Esta acción no se puede deshacer.",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Restablecer",
          style: "destructive",
          onPress: async () => {
            try {
              // Guardar una copia de las estadísticas actuales antes de limpiar
              const currentStats = { ...profileStats };
              const currentMedals = userMedals;
              
              // Limpiar progreso local primero
              clearProgress(); 
              
              // Actualizar stats locales inmediatamente
              setProfileStats({
                booksRead: 0,
                exercisesCompleted: 0,
                totalMinutes: 0
              });
              
              setUserMedals(0);
              setUserLevel(1);
              setLevel('Principiante');`
);

// Guardar cambios en ProfileScreen.js
fs.writeFileSync(profileScreenPath, profileScreenContent);
console.log('✅ ProfileScreen.js actualizado correctamente');

// Corregir ProgressScreen.js
let progressScreenContent = fs.readFileSync(progressScreenPath, 'utf8');

// Corregir la función fetchFirestoreData
progressScreenContent = progressScreenContent.replace(
  /const fetchFirestoreData = async \(\) => {[\s\S]*?try {[\s\S]*?setReadingStats\({ total: totalBooks, completed: readingCount }\);/,
  `const fetchFirestoreData = async () => {
    try {
      // Fetch reading stats
      const readingQuery = query(collection(db, 'users', user.uid, 'reading'));
      const readingSnapshot = await getDocs(readingQuery);
      const readingCount = readingSnapshot.size;
      
      // Fetch total books from database
      const booksQuery = query(collection(db, 'books'));
      const booksSnapshot = await getDocs(booksQuery);
      const totalBooks = booksSnapshot.size || 5;
      
      // Fetch exercise stats
      const exerciseQuery = query(collection(db, 'users', user.uid, 'quizzes'));
      const exerciseSnapshot = await getDocs(exerciseQuery);
      const exerciseCount = exerciseSnapshot.size;
      
      // Fetch verbal fluency stats
      const verbalQuery = query(
        collection(db, 'users', user.uid, 'verbalExercises'),
        where('completed', '==', true)
      );
      const verbalSnapshot = await getDocs(verbalQuery);
      const verbalCount = verbalSnapshot.size;
      
      // Fetch total verbal exercises from database
      const verbalExercisesQuery = query(collection(db, 'verbalExercises'));
      const verbalExercisesSnapshot = await getDocs(verbalExercisesQuery);
      const totalVerbalExercises = verbalExercisesSnapshot.size || 5;
      
      // Fetch recent activity
      const activityQuery = query(
        collection(db, 'users', user.uid, 'activity'),
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      const activitySnapshot = await getDocs(activityQuery);
      const activityList = activitySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Set statistics en estado local
      setReadingStats({ total: totalBooks, completed: readingCount });`
);

progressScreenContent = progressScreenContent.replace(
  `setExerciseStats({ total: exerciseCount + totalBooks, completed: exerciseCount });`,
  `setExerciseStats({ total: totalBooks, completed: exerciseCount });`
);

// Corregir la navegación del botón "Comenzar ahora"
progressScreenContent = progressScreenContent.replace(
  `onPress={() => navigation.navigate('MainTabs')}`,
  `onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}`
);

// Mejorar la carga de medallas
progressScreenContent = progressScreenContent.replace(
  /\/\/ Cargar medallas desde Firestore[\s\S]*?try {[\s\S]*?const medalsCollection[\s\S]*?setUserMedals\(medals\);[\s\S]*?}/,
  `// Cargar medallas desde Firestore
      try {
        const medalsCollection = collection(db, 'users', user.uid, 'medals');
        const medalsSnapshot = await getDocs(medalsCollection);
        
        if (!medalsSnapshot.empty) {
          const firestoreMedals = medalsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Actualizar el estado local
          setUserMedals(firestoreMedals);
          console.log("Medals loaded from Firestore:", firestoreMedals.length);
        } else {
          // Si no hay medallas en Firestore, usar las del store
          setUserMedals(medals);
        }
      } catch (error) {
        console.error("Error fetching medals:", error);
        // En caso de error, al menos usar las medallas del store
        setUserMedals(medals);
      }`
);

// Guardar cambios en ProgressScreen.js
fs.writeFileSync(progressScreenPath, progressScreenContent);
console.log('✅ ProgressScreen.js actualizado correctamente');

console.log('✅ Todos los archivos han sido actualizados correctamente');
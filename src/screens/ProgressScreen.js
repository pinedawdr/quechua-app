// src/screens/ProgressScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { collection, getDocs, query, where, limit, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import useProgressStore from '../store/progressStore';
import useAuthStore from '../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, globalStyles } from '../styles/globalStyles';
import { LinearGradient } from 'expo-linear-gradient';

const ProgressScreen = ({ navigation }) => {
  const { medals } = useProgressStore();
  
  const { user, isGuest, guestName } = useAuthStore();
  const [readingStats, setReadingStats] = useState({ total: 0, completed: 0 });
  const [exerciseStats, setExerciseStats] = useState({ total: 0, completed: 0 });
  const [verbalsStats, setVerbalsStats] = useState({ total: 0, completed: 0 });
  const [showAllMedals, setShowAllMedals] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userMedals, setUserMedals] = useState([]);
  
  useEffect(() => {
    setLoading(true);
    
    // Fetch statistics and recent activity
    const fetchData = async () => {
      try {
        if (!isGuest && user) {
          await fetchFirestoreData();
        } else {
          fetchLocalData();
        }
      } catch (error) {
        console.error('Error fetching progress data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    // Eliminar readingProgress, exerciseProgress, verbalFluencyProgress, medals de las dependencias
  }, [user, isGuest]);
  
  // Extraer datos de Firestore para usuarios autenticados sin actualizar el store
  const fetchFirestoreData = async () => {
    try {
      // Fetch reading stats
      const readingQuery = query(collection(db, 'users', user.uid, 'reading'));
      const readingSnapshot = await getDocs(readingQuery);
      const readingCount = readingSnapshot.size;
      
      // Fetch total books from database
      const booksQuery = query(collection(db, 'books'));
      const booksSnapshot = await getDocs(booksQuery);
      const totalBooks = booksSnapshot.size;
      
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
      const totalVerbalExercises = verbalExercisesSnapshot.size;
      
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
      setReadingStats({ total: totalBooks, completed: readingCount });
      setExerciseStats({ total: exerciseCount + totalBooks, completed: exerciseCount });
      setVerbalsStats({ total: totalVerbalExercises, completed: verbalCount });
      setRecentActivity(activityList);
      
      // Cargar medallas desde Firestore
      try {
        const medalsCollection = collection(db, 'users', user.uid, 'medals');
        const medalsSnapshot = await getDocs(medalsCollection);
        
        if (!medalsSnapshot.empty) {
          const firestoreMedals = medalsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Solo actualizar el estado local, no el store global
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
      }
    } catch (error) {
      console.error("Error in fetchFirestoreData:", error);
      throw error;
    }
  };
  
  // Use local progress for guest users
  const fetchLocalData = () => {
    // Usar el store actual sin modificarlo
    const { readingProgress, exerciseProgress, verbalFluencyProgress } = useProgressStore.getState();
    
    const readingCompleted = Object.keys(readingProgress).length;
    const exerciseCompleted = Object.keys(exerciseProgress).length;
    const verbalCompleted = Object.keys(verbalFluencyProgress).length;
    
    setReadingStats({ total: readingCompleted + 2, completed: readingCompleted });
    setExerciseStats({ total: exerciseCompleted + 3, completed: exerciseCompleted });
    setVerbalsStats({ total: verbalCompleted + 4, completed: verbalCompleted });
    
    // Generate local recent activity from progress stores
    const combinedActivity = [
      ...Object.keys(readingProgress).map(id => ({
        id,
        type: 'reading',
        title: 'Lectura completada',
        timestamp: readingProgress[id].lastRead || new Date().toISOString()
      })),
      ...Object.keys(exerciseProgress).map(id => ({
        id,
        type: 'exercise',
        title: 'Quiz completado',
        score: exerciseProgress[id],
        timestamp: new Date().toISOString()
      })),
      ...Object.keys(verbalFluencyProgress).map(id => ({
        id,
        type: 'verbal',
        title: 'Ejercicio verbal completado',
        timestamp: new Date().toISOString()
      }))
    ];
    
    // Sort by timestamp
    combinedActivity.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    setRecentActivity(combinedActivity.slice(0, 5));
    
    // Usar medallas del store para usuarios invitados
    setUserMedals(medals);
  };
  
  // Actualizar medallas cuando cambien en el store
  useEffect(() => {
    if (isGuest || !user) {
      setUserMedals(medals);
    }
  }, [medals, isGuest, user]);
  
  // Calculate overall progress percentage
  const totalActivities = readingStats.total + exerciseStats.total + verbalsStats.total;
  const completedActivities = readingStats.completed + exerciseStats.completed + verbalsStats.completed;
  const overallProgress = totalActivities > 0 
    ? Math.round((completedActivities / totalActivities) * 100) 
    : 0;
    
  // Función para navegar a actividades de tipo específico
  const navigateToActivity = (activityType) => {
    switch(activityType) {
      case 'reading':
        navigation.navigate('ReadingActivities');
        break;
      case 'verbal':
        navigation.navigate('VerbalFluency');
        break;
      case 'interactive':
        navigation.navigate('InteractiveNarratives');
        break;
      default:
        break;
    }
  };
  
  // Función para obtener el ícono para un tipo de actividad
  const getActivityIcon = (type) => {
    switch(type) {
      case 'reading':
        return <Ionicons name="book" size={24} color="white" />;
      case 'exercise':
        return <Ionicons name="document-text" size={24} color="white" />;
      case 'verbal':
        return <Ionicons name="mic" size={24} color="white" />;
      case 'narrative':
        return <Ionicons name="chatbubbles" size={24} color="white" />;
      default:
        return <Ionicons name="checkmark-circle" size={24} color="white" />;
    }
  };
  
 // Obtener color según el tipo de actividad
 const getActivityColor = (type) => {
  switch(type) {
    case 'reading':
      return ['#5B86E5', '#36D1DC'];
    case 'exercise':
      return ['#7C5CEF', '#5B86E5'];
    case 'verbal':
      return ['#36D1DC', '#5B86E5'];
    case 'narrative':
      return ['#FF9E80', '#FF6E40'];
    default:
      return COLORS.gradient;
  }
};

// Renderizar un elemento de actividad reciente
const renderActivityItem = (item, index) => {
  const date = new Date(item.timestamp);
  const formattedDate = date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short'
  });
  
  return (
    <TouchableOpacity 
      key={`${item.id}-${index}`}
      style={styles.activityItem}
      onPress={() => navigateToActivity(item.type)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={getActivityColor(item.type)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.activityItemIcon}
      >
        {getActivityIcon(item.type)}
      </LinearGradient>
      
      <View style={styles.activityItemContent}>
        <Text style={styles.activityItemTitle}>{item.title}</Text>
        <Text style={styles.activityItemDate}>{formattedDate}</Text>
      </View>
      
      {item.score !== undefined && (
        <View style={styles.activityItemScoreContainer}>
          <Text style={styles.activityItemScore}>{item.score}%</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

return (
  <SafeAreaView style={globalStyles.container}>
    <LinearGradient
      colors={COLORS.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Mi Progreso</Text>
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.8}
        >
          <Text style={styles.avatarText}>
            {(isGuest ? guestName : (user?.displayName || 'Usuario')).charAt(0).toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.progressCircleWrapper}>
        <View style={styles.progressCircle}>
          <Text style={styles.progressPercentage}>{overallProgress}%</Text>
          <Text style={styles.progressLabel}>Completado</Text>
        </View>
      </View>
    </LinearGradient>
    
    <FlatList 
      style={styles.content}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentScrollContainer}
      ListHeaderComponent={
        <>
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Actividades</Text>
            
            <TouchableOpacity 
              style={styles.activityCard}
              onPress={() => navigateToActivity('reading')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#5B86E5', '#36D1DC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.activityIconContainer}
              >
                <Ionicons name="book" size={24} color="white" />
              </LinearGradient>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Lecturas</Text>
                <View style={styles.activityProgressContainer}>
                  <View style={styles.activityProgressBar}>
                    <View 
                      style={[
                        styles.activityProgressFill, 
                        { 
                          width: `${Math.max(1, (readingStats.completed / Math.max(1, readingStats.total)) * 100)}%`,
                          backgroundColor: '#5B86E5'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.activityProgressText}>
                    {readingStats.completed}/{readingStats.total}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.activityCard}
              onPress={() => navigateToActivity('reading')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#7C5CEF', '#5B86E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.activityIconContainer}
              >
                <Ionicons name="document-text" size={24} color="white" />
              </LinearGradient>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Comprensión</Text>
                <View style={styles.activityProgressContainer}>
                  <View style={styles.activityProgressBar}>
                    <View 
                      style={[
                        styles.activityProgressFill, 
                        { 
                          width: `${Math.max(1, (exerciseStats.completed / Math.max(1, exerciseStats.total)) * 100)}%`,
                          backgroundColor: '#7C5CEF'
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.activityProgressText}>
                    {exerciseStats.completed}/{exerciseStats.total}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.activityCard}
              onPress={() => navigateToActivity('verbal')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#36D1DC', '#5B86E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.activityIconContainer}
              >
                <Ionicons name="mic" size={24} color="white" />
              </LinearGradient>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Fluidez Verbal</Text>
                <View style={styles.activityProgressContainer}>
                  <View style={styles.activityProgressBar}>
                    <View 
                      style={[
                        styles.activityProgressFill, 
                        { 
                          width: `${Math.max(1, (verbalsStats.completed / Math.max(1, verbalsStats.total)) * 100)}%`,
                          backgroundColor: '#36D1DC'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.activityProgressText}>
                    {verbalsStats.completed}/{verbalsStats.total}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
          
          {recentActivity.length > 0 && (
            <View style={styles.recentActivitySection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Actividad Reciente</Text>
              </View>
              
              {recentActivity.map((item, index) => renderActivityItem(item, index))}
              
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => {
                  // Aquí podríamos navegar a una pantalla con historial completo
                  Alert.alert('Próximamente', 'El historial completo estará disponible en próximas versiones.');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.viewAllText}>Ver todo el historial</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.medalsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mis Logros</Text>
              {userMedals.length > 3 && (
                <TouchableOpacity 
                  onPress={() => setShowAllMedals(!showAllMedals)}
                  style={styles.seeMoreButton}  
                >
                  <Text style={styles.seeMoreText}>
                    {showAllMedals ? 'Ver menos' : 'Ver todos'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {userMedals.length === 0 ? (
              <View style={styles.emptyMedalsContainer}>
                <Ionicons name="trophy" size={60} color={COLORS.textLight} style={{marginBottom: 16}} />
                <Text style={styles.emptyMedalsText}>
                  ¡Completa actividades para ganar medallas!
                </Text>
                <TouchableOpacity 
                  style={styles.startButton}
                  onPress={() => navigation.navigate('MainTabs')}
                  activeOpacity={0.8}  
                >
                  <Text style={styles.startButtonText}>Comenzar ahora</Text>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {(showAllMedals ? userMedals : userMedals.slice(0, 3)).map((medal, index) => (
                  <View key={medal.id || index} style={styles.medalItem}>
                    <LinearGradient
                      colors={getMedalGradient(medal.type)}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.medalIconContainer}
                    >
                      {getMedalIcon(medal.type)}
                    </LinearGradient>
                    <View style={styles.medalInfo}>
                      <Text style={styles.medalTitle}>{medal.title}</Text>
                      <Text style={styles.medalDescription}>{medal.description}</Text>
                      <Text style={styles.medalDate}>
                        {new Date(medal.date).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
          
          <View style={styles.weeklyStatsContainer}>
            <Text style={styles.sectionTitle}>Esta semana</Text>
            <View style={styles.weeklyStatsCard}>
              <View style={styles.weeklyStatItem}>
                <View style={[styles.statIconContainer, {backgroundColor: 'rgba(91, 134, 229, 0.15)'}]}>
                  <Ionicons name="time" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.weeklyStatValue}>
                  {(readingStats.completed + exerciseStats.completed) * 5} min
                </Text>
                <Text style={styles.weeklyStatLabel}>Tiempo total</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.weeklyStatItem}>
                <View style={[styles.statIconContainer, {backgroundColor: 'rgba(124, 92, 239, 0.15)'}]}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
                </View>
                <Text style={[styles.weeklyStatValue, {color: COLORS.accent}]}>
                  {completedActivities}
                </Text>
                <Text style={styles.weeklyStatLabel}>Completados</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.weeklyStatItem}>
                <View style={[styles.statIconContainer, {backgroundColor: 'rgba(255, 152, 0, 0.15)'}]}>
                  <Ionicons name="trending-up" size={20} color={COLORS.warning} />
                </View>
                <Text style={[styles.weeklyStatValue, {color: COLORS.warning}]}>
                  {userMedals.length}
                </Text>
                <Text style={styles.weeklyStatLabel}>Logros</Text>
              </View>
            </View>
          </View>
        </>
      }
    />
  </SafeAreaView>
);
};

// Función auxiliar para obtener el color según el tipo de medalla
const getMedalGradient = (type) => {
switch(type) {
  case 'quiz':
    return ['#5B86E5', '#36D1DC'];
  case 'verbal':
    return ['#7C5CEF', '#5B86E5'];
  case 'narrative':
    return ['#36D1DC', '#5B86E5'];
  default:
    return ['#FF9E80', '#FF6E40'];
}
};

// Función auxiliar para obtener el icono según el tipo de medalla
const getMedalIcon = (type) => {
switch(type) {
  case 'quiz':
    return <Ionicons name="book" size={24} color="white" />;
  case 'verbal':
    return <Ionicons name="mic" size={24} color="white" />;
  case 'narrative':
    return <Ionicons name="chatbubbles" size={24} color="white" />;
  default:
    return <Ionicons name="trophy" size={24} color="white" />;
}
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
    paddingBottom: 70,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  progressCircleWrapper: {
    alignItems: 'center',
    marginTop: 20,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressPercentage: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  progressLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.background,
    marginTop: -40,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  contentScrollContainer: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 50,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  seeMoreButton: {
    backgroundColor: 'rgba(91, 134, 229, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  seeMoreText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activityIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  activityProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityProgressBar: {
    flex: 1,
    height: 10,
    backgroundColor: COLORS.background,
    borderRadius: 5,
    overflow: 'hidden',
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activityProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  activityProgressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textLight,
    minWidth: 45,
    textAlign: 'right',
  },
  recentActivitySection: {
    marginBottom: 30,
  },
  activityItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activityItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityItemContent: {
    flex: 1,
  },
  activityItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  activityItemDate: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  activityItemScoreContainer: {
    backgroundColor: 'rgba(91, 134, 229, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activityItemScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 5,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginRight: 4,
  },
  medalsSection: {
    marginBottom: 30,
  },
  emptyMedalsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyMedalsText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: 'rgba(91, 134, 229, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  startButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginRight: 4,
  },
  medalItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  medalIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  medalInfo: {
    flex: 1,
  },
  medalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  medalDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 8,
    lineHeight: 20,
  },
  medalDate: {
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  weeklyStatsContainer: {
    marginBottom: 30,
  },
  weeklyStatsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  weeklyStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  weeklyStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  weeklyStatLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: COLORS.border,
    alignSelf: 'center',
  }
});

export default ProgressScreen;
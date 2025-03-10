// src/screens/ProgressScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import useProgressStore from '../store/progressStore';
import useAuthStore from '../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, globalStyles } from '../styles/globalStyles';
import { LinearGradient } from 'expo-linear-gradient';

const ProgressScreen = ({ navigation }) => {
  const { 
    readingProgress, 
    exerciseProgress, 
    verbalFluencyProgress,
    medals 
  } = useProgressStore();
  
  const { user, isGuest, guestName } = useAuthStore();
  const [readingStats, setReadingStats] = useState({ total: 0, completed: 0 });
  const [exerciseStats, setExerciseStats] = useState({ total: 0, completed: 0 });
  const [verbalsStats, setVerbalsStats] = useState({ total: 0, completed: 0 });
  const [showAllMedals, setShowAllMedals] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  
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
  }, [user, isGuest, readingProgress, exerciseProgress, verbalFluencyProgress]);
  
  // Fetch data from Firestore for authenticated users
  const fetchFirestoreData = async () => {
    // Fetch reading stats
    const readingQuery = query(
      collection(db, 'users', user.uid, 'reading')
    );
    const readingSnapshot = await getDocs(readingQuery);
    const readingCount = readingSnapshot.size;
    
    // Fetch total books from database
    const booksQuery = query(collection(db, 'books'));
    const booksSnapshot = await getDocs(booksQuery);
    const totalBooks = booksSnapshot.size;
    
    // Fetch exercise stats
    const exerciseQuery = query(
      collection(db, 'users', user.uid, 'quizzes')
    );
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
    
    // Set statistics
    setReadingStats({ total: totalBooks, completed: readingCount });
    setExerciseStats({ total: exerciseCount + totalBooks, completed: exerciseCount });
    setVerbalsStats({ total: totalVerbalExercises, completed: verbalCount });
    setRecentActivity(activityList);
  };
  
  // Use local progress for guest users
  const fetchLocalData = () => {
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
  };
  
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
      return ['#4A6FFF', '#36D1DC'];
    case 'exercise':
      return ['#5E60CE', '#6A67CE'];
    case 'verbal':
      return ['#36D1DC', '#5B86E5'];
    case 'narrative':
      return ['#F6AD55', '#F69A55'];
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
  <View style={globalStyles.container}>
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
    
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.contentInner}>
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Actividades</Text>
          
          <TouchableOpacity 
            style={styles.activityCard}
            onPress={() => navigateToActivity('reading')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#4A6FFF', '#36D1DC']}
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
                        backgroundColor: '#4A6FFF'
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
              colors={['#5E60CE', '#6A67CE']}
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
                        backgroundColor: '#5E60CE'
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
            {medals.length > 3 && (
              <TouchableOpacity onPress={() => setShowAllMedals(!showAllMedals)}>
                <Text style={styles.seeMoreText}>
                  {showAllMedals ? 'Ver menos' : 'Ver todos'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {medals.length === 0 ? (
            <TouchableOpacity 
              style={styles.emptyMedalsContainer}
              onPress={() => navigation.navigate('Main')}
              activeOpacity={0.8}
            >
              <Ionicons name="trophy-outline" size={80} color={COLORS.textLight} style={{marginBottom: 15}} />
              <Text style={styles.emptyMedalsText}>
                ¡Completa actividades para ganar medallas!
              </Text>
              <View style={styles.startButton}>
                <Text style={styles.startButtonText}>Comenzar ahora</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          ) : (
            (showAllMedals ? medals : medals.slice(0, 3)).map((medal, index) => (
              <View key={index} style={styles.medalItem}>
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
            ))
          )}
        </View>
        
        <View style={styles.weeklyStatsContainer}>
          <Text style={styles.sectionTitle}>Esta semana</Text>
          <View style={styles.weeklyStatsCard}>
            <View style={styles.weeklyStatItem}>
              <View style={[styles.statIconContainer, {backgroundColor: 'rgba(74, 111, 255, 0.15)'}]}>
                <Ionicons name="time" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.weeklyStatValue}>
                {(readingStats.completed + exerciseStats.completed) * 5} min
              </Text>
              <Text style={styles.weeklyStatLabel}>Tiempo total</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.weeklyStatItem}>
              <View style={[styles.statIconContainer, {backgroundColor: 'rgba(94, 96, 206, 0.15)'}]}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
              </View>
              <Text style={[styles.weeklyStatValue, {color: COLORS.accent}]}>
                {completedActivities}
              </Text>
              <Text style={styles.weeklyStatLabel}>Completados</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.weeklyStatItem}>
              <View style={[styles.statIconContainer, {backgroundColor: 'rgba(246, 173, 85, 0.15)'}]}>
                <Ionicons name="trending-up" size={20} color={COLORS.warning} />
              </View>
              <Text style={[styles.weeklyStatValue, {color: COLORS.warning}]}>
                {medals.length}
              </Text>
              <Text style={styles.weeklyStatLabel}>Logros</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.footer}></View>
      </View>
    </ScrollView>
  </View>
);
};

// Función auxiliar para obtener el color según el tipo de medalla
const getMedalGradient = (type) => {
switch(type) {
  case 'quiz':
    return ['#4A6FFF', '#36D1DC'];
  case 'verbal':
    return ['#5E60CE', '#6A67CE'];
  case 'narrative':
    return ['#36D1DC', '#5B86E5'];
  default:
    return ['#F6AD55', '#F69A55'];
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
  paddingTop: 60,
  paddingBottom: 80,
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
  fontSize: 30,
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
  marginTop: -50,
  borderTopLeftRadius: 30,
  borderTopRightRadius: 30,
},
contentInner: {
  padding: 20,
  paddingTop: 40,
},
sectionHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 15,
},
statsSection: {
  marginBottom: 25,
},
sectionTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  color: COLORS.text,
  marginBottom: 15,
},
seeMoreText: {
  fontSize: 14,
  color: COLORS.primary,
  fontWeight: '600',
},
activityCard: {
  backgroundColor: 'white',
  borderRadius: 16,
  padding: 15,
  marginBottom: 15,
  flexDirection: 'row',
  alignItems: 'center',
},
activityIconContainer: {
  width: 50,
  height: 50,
  borderRadius: 15,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 15,
},
activityInfo: {
  flex: 1,
},
activityTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: COLORS.text,
  marginBottom: 8,
},
activityProgressContainer: {
  flexDirection: 'row',
  alignItems: 'center',
},
activityProgressBar: {
  flex: 1,
  height: 8,
  backgroundColor: '#F0F0F5',
  borderRadius: 4,
  overflow: 'hidden',
  marginRight: 10,
},
activityProgressFill: {
  height: '100%',
  borderRadius: 4,
},
activityProgressText: {
  fontSize: 14,
  fontWeight: 'bold',
  color: COLORS.textLight,
  minWidth: 40,
  textAlign: 'right',
},
recentActivitySection: {
  marginBottom: 25,
},
activityItem: {
  backgroundColor: 'white',
  borderRadius: 16,
  padding: 15,
  marginBottom: 10,
  flexDirection: 'row',
  alignItems: 'center',
},
activityItemIcon: {
  width: 44,
  height: 44,
  borderRadius: 12,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 15,
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
  backgroundColor: 'rgba(74, 111, 255, 0.1)',
  paddingHorizontal: 10,
  paddingVertical: 5,
  borderRadius: 12,
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
  marginBottom: 25,
},
emptyMedalsContainer: {
  backgroundColor: 'white',
  borderRadius: 16,
  padding: 30,
  alignItems: 'center',
  justifyContent: 'center',
},
emptyMedalsText: {
  fontSize: 16,
  color: COLORS.textLight,
  textAlign: 'center',
  marginBottom: 15,
},
startButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 8,
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
  padding: 15,
  marginBottom: 15,
},
medalIconContainer: {
  width: 50,
  height: 50,
  borderRadius: 15,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 15,
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
  marginBottom: 6,
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
  marginTop: 15,
  flexDirection: 'row',
  justifyContent: 'space-between',
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
},
footer: {
  height: 50,
}
});

export default ProgressScreen;
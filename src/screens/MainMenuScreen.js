// src/screens/MainMenuScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useAuthStore from '../store/authStore';
import useProgressStore from '../store/progressStore';
import { collection, getDocs, query, where, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, globalStyles } from '../styles/globalStyles';

const MainMenuScreen = ({ navigation }) => {
  const { isGuest, guestName, user } = useAuthStore();
  const { readingProgress, exerciseProgress, verbalFluencyProgress } = useProgressStore();
  const [lastActivity, setLastActivity] = useState(null);
  const [stats, setStats] = useState({
    daysActive: 0,
    activitiesCompleted: 0
  });
  // Añadir estado para almacenar la imagen de perfil
  const [profileImage, setProfileImage] = useState(null);
  
  // Extraer solo el primer nombre
  const fullName = isGuest ? guestName : (user?.displayName || 'Usuario');
  const displayName = fullName.split(' ')[0]; // Obtener solo el primer nombre
  
  // Cargar estadísticas reales y última actividad
  useEffect(() => {
    const loadUserData = async () => {
      // Calcular días activos (por ahora usamos un valor fijo para demostración)
      const daysActive = 1;
      
      // Calcular actividades completadas
      let activitiesCompleted = 0;
      let lastActivityData = null;
      
      // Si el usuario está autenticado, obtenemos las estadísticas de Firestore
      if (!isGuest && user) {
        try {
          // Obtener la imagen de perfil del usuario
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().profileImage) {
            setProfileImage(userDoc.data().profileImage);
          }

          // Contar actividades de lectura completadas
          const readingQuery = collection(db, 'users', user.uid, 'reading');
          const readingSnapshot = await getDocs(readingQuery);
          
          // Contar quizzes completados
          const quizzesQuery = collection(db, 'users', user.uid, 'quizzes');
          const quizzesSnapshot = await getDocs(quizzesQuery);
          
          // Contar ejercicios verbales completados
          const verbalQuery = collection(db, 'users', user.uid, 'verbalExercises');
          const verbalSnapshot = await getDocs(verbalQuery);
          
          activitiesCompleted = readingSnapshot.size + quizzesSnapshot.size + verbalSnapshot.size;
          
          // Obtener última actividad
          const lastActivityQuery = query(
            collection(db, 'users', user.uid, 'activity'),
            where('timestamp', '!=', null),
            limit(1)
          );
          const lastActivitySnapshot = await getDocs(lastActivityQuery);
          
          if (!lastActivitySnapshot.empty) {
            lastActivityData = {
              id: lastActivitySnapshot.docs[0].id,
              ...lastActivitySnapshot.docs[0].data()
            };
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        // Para usuarios invitados, usamos el progreso local
        activitiesCompleted = 
          Object.keys(readingProgress).length + 
          Object.keys(exerciseProgress).length + 
          Object.keys(verbalFluencyProgress).length;
        
        // Buscar última actividad en el progreso local
        if (Object.keys(readingProgress).length > 0) {
          const lastBookId = Object.keys(readingProgress)[Object.keys(readingProgress).length - 1];
          lastActivityData = {
            type: 'reading',
            itemId: lastBookId,
            title: 'Continuar lectura'
          };
        }
      }
      
      setStats({ daysActive, activitiesCompleted });
      setLastActivity(lastActivityData);
    };
    
    loadUserData();
  }, [isGuest, user, readingProgress, exerciseProgress, verbalFluencyProgress]);
  
  // Navegar a la última actividad
  const navigateToLastActivity = () => {
    if (!lastActivity) return;
    
    switch(lastActivity.type) {
      case 'reading':
        navigation.navigate('BookReader', { bookId: lastActivity.itemId });
        break;
      case 'verbal':
        navigation.navigate('VerbalExercise', { exerciseId: lastActivity.itemId });
        break;
      case 'narrative':
        navigation.navigate('InteractiveNarrative', { narrativeId: lastActivity.itemId });
        break;
      default:
        navigation.navigate('ReadingActivities');
    }
  };
  
  const menuItems = [
    {
      id: 'reading',
      title: 'Actividades de Lectura',
      description: 'Libros interactivos en quechua para practicar tu lectura',
      icon: 'book',
      colors: ['#5B86E5', '#36D1DC'],
      screen: 'ReadingActivities'
    },
    {
      id: 'verbal',
      title: 'Ejercicios de Fluidez',
      description: 'Practica tu pronunciación y habla en quechua',
      icon: 'mic',
      colors: ['#7C5CEF', '#5B86E5'],
      screen: 'VerbalFluency'
    },
    {
      id: 'interactive',
      title: 'Narrativas Interactivas',
      description: 'Participa en historias interactivas en quechua',
      icon: 'chatbubbles',
      colors: ['#36D1DC', '#5B86E5'],
      screen: 'InteractiveNarratives'
    },
    {
      id: 'progress',
      title: 'Mi Progreso',
      description: 'Revisa tu avance y logros',
      icon: 'trophy',
      colors: ['#FF9E80', '#FF6E40'],
      screen: 'Progress'
    }
  ];

  // Obtener consejo aleatorio del día
  const getTodayTip = () => {
    const tips = [
      {
        title: "Consejo del día",
        text: "Practica todos los días un poco. La constancia es clave para el aprendizaje de idiomas."
      },
      {
        title: "Pronunciación",
        text: "Escucha con atención los ejemplos de audio y repite en voz alta para mejorar tu pronunciación en quechua."
      },
      {
        title: "Vocabulario",
        text: "Aprende 5 palabras nuevas cada día y úsalas en contexto para reforzar tu memoria."
      },
      {
        title: "Inmersión",
        text: "Escucha música o ve videos en quechua para familiarizarte con el ritmo y sonidos del idioma."
      }
    ];
    
    // Usar fecha actual como semilla para seleccionar un consejo consistente durante el día
    const today = new Date().toDateString();
    const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = seed % tips.length;
    
    return tips[index];
  };
  
  const todayTip = getTodayTip();

  return (
    <SafeAreaView style={globalStyles.container}>
      <LinearGradient
        colors={COLORS.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>¡Allin p'unchay, {displayName}!</Text>
            <Text style={styles.subGreeting}>Bienvenido a YachayApp</Text>
          </View>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            {profileImage ? (
              <Image 
                source={{ uri: profileImage }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeCardContent}>
            <Text style={styles.welcomeTitle}>¡Empecemos a aprender!</Text>
            <Text style={styles.welcomeText}>
              Explora nuestras actividades para mejorar tu quechua de forma divertida e interactiva.
            </Text>
          </View>
          <Image 
            source={require('../assets/images/logotype.png')} 
            style={styles.welcomeImage}
            resizeMode="contain"
          />
        </View>
        
        {lastActivity && (
          <TouchableOpacity
            style={styles.continueCard}
            onPress={navigateToLastActivity}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(91, 134, 229, 0.9)', 'rgba(54, 209, 220, 0.9)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueBg}
            >
              <View style={styles.continueIcon}>
                <Ionicons name="play-circle" size={26} color="white" />
              </View>
              <View style={styles.continueContent}>
                <Text style={styles.continueTitle}>Continuar aprendiendo</Text>
                <Text style={styles.continueText}>
                  {lastActivity.title || 'Continuar donde lo dejaste'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        )}
        
        <View style={styles.activitiesHeader}>
          <Text style={styles.sectionTitle}>Actividades</Text>
          <View style={styles.activitiesCount}>
            <Text style={styles.activitiesCountText}>{stats.activitiesCompleted}</Text>
            <Text style={styles.activitiesCountLabel}>completadas</Text>
          </View>
        </View>
        
        {menuItems.map(item => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.menuCard}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={item.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.menuCardGradient}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon} size={32} color="white" />
              </View>
              
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
              
              <View style={styles.menuArrowContainer}>
                <Ionicons 
                  name="chevron-forward" 
                  size={24} 
                  color="white" 
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <View style={styles.statIconContainer}>
                <Ionicons name="time" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.statValue}>{stats.daysActive}</Text>
              <Text style={styles.statLabel}>Días Aprendiendo</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <View style={[styles.statIconContainer, styles.statIconAccent]}>
                <Ionicons name="flame" size={22} color={COLORS.accent} />
              </View>
              <Text style={[styles.statValue, styles.statValueAccent]}>{stats.activitiesCompleted}</Text>
              <Text style={styles.statLabel}>Actividades Completadas</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.tipCard}>
          <View style={styles.tipIconContainer}>
            <Ionicons name="bulb" size={24} color={COLORS.warning} />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>{todayTip.title}</Text>
            <Text style={styles.tipText}>
              {todayTip.text}
            </Text>
          </View>
        </View>
        
        {Object.keys(readingProgress).length > 0 && (
          <View style={styles.recommendedContainer}>
            <Text style={styles.recommendedTitle}>Recomendado para ti</Text>
            <TouchableOpacity 
              style={styles.recommendedCard}
              onPress={() => navigation.navigate('ReadingActivities')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['rgba(91, 134, 229, 0.15)', 'rgba(54, 209, 220, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.recommendedContent}
              >
                <Ionicons name="book" size={24} color={COLORS.primary} style={styles.recommendedIcon} />
                <View style={styles.recommendedTextContainer}>
                  <Text style={styles.recommendedCardTitle}>Continúa tu lectura</Text>
                  <Text style={styles.recommendedCardText}>Avanza en tu último libro</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={28} color={COLORS.primary} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subGreeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  avatarContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.background,
    marginTop: -50,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 50,
  },
  welcomeCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  welcomeCardContent: {
    flex: 1,
    paddingRight: 10,
  },
  welcomeImage: {
    width: 60,
    height: 60,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 15,
    color: COLORS.textLight,
    lineHeight: 22,
  },
  continueCard: {
    borderRadius: 16,
    marginBottom: 25,
    overflow: 'hidden',
  },
  continueBg: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  continueIcon: {
    marginRight: 15,
  },
  continueContent: {
    flex: 1,
  },
  continueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  continueText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  activitiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  activitiesCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(91, 134, 229, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activitiesCountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: 4,
  },
  activitiesCountLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  menuCard: {
    borderRadius: 16,
    marginBottom: 16,
    height: 120,
    overflow: 'hidden',
  },
  menuCardGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  menuIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
    paddingRight: 10,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  menuDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
  },
  menuArrowContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    marginTop: 15,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
  },
  statContent: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(91, 134, 229, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statIconAccent: {
    backgroundColor: 'rgba(124, 92, 239, 0.15)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  statValueAccent: {
    color: COLORS.accent,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  tipCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: COLORS.warning,
    borderStyle: 'dashed',
  },
  tipIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.warning,
    marginBottom: 5,
  },
  tipText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  recommendedContainer: {
    marginTop: 10,
    marginBottom: 30,
  },
  recommendedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  recommendedCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recommendedContent: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendedIcon: {
    marginRight: 16,
  },
  recommendedTextContainer: {
    flex: 1,
  },
  recommendedCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  recommendedCardText: {
    fontSize: 14,
    color: COLORS.textLight,
  }
});

export default MainMenuScreen;
// src/screens/MainMenuScreen.js (modificado para mostrar la imagen de perfil)
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
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
      icon: 'book-outline',
      colors: ['#4A6FFF', '#36D1DC'],
      screen: 'ReadingActivities'
    },
    {
      id: 'verbal',
      title: 'Ejercicios de Fluidez Verbal',
      description: 'Practica tu pronunciación y habla en quechua',
      icon: 'mic-outline',
      colors: ['#5E60CE', '#6A67CE'],
      screen: 'VerbalFluency'
    },
    {
      id: 'interactive',
      title: 'Narrativas Interactivas',
      description: 'Participa en historias interactivas en quechua',
      icon: 'chatbubbles-outline',
      colors: ['#36D1DC', '#5B86E5'],
      screen: 'InteractiveNarratives'
    },
    {
      id: 'progress',
      title: 'Mi Progreso',
      description: 'Revisa tu avance y logros',
      icon: 'trophy-outline',
      colors: ['#F6AD55', '#F69A55'],
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
    <View style={globalStyles.container}>
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
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentInner}>
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeCardContent}>
              <Text style={styles.welcomeTitle}>¡Empecemos a aprender!</Text>
              <Text style={styles.welcomeText}>
                Explora nuestras actividades para mejorar tu quechua de forma divertida e interactiva.
              </Text>
            </View>
          </View>
          
          {lastActivity && (
            <TouchableOpacity
              style={styles.continueCard}
              onPress={navigateToLastActivity}
              activeOpacity={0.8}
            >
              <View style={styles.continueIcon}>
                <Ionicons name="play-circle" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.continueContent}>
                <Text style={styles.continueTitle}>Continuar aprendiendo</Text>
                <Text style={styles.continueText}>
                  {lastActivity.title || 'Continuar donde lo dejaste'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
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
                <View style={styles.menuCardOverlay}>
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
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
          
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['rgba(74, 111, 255, 0.1)', 'rgba(54, 209, 220, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statContent}
              >
                <View style={styles.statIconContainer}>
                  <Ionicons name="time-outline" size={22} color={COLORS.primary} />
                </View>
                <Text style={styles.statValue}>{stats.daysActive}</Text>
                <Text style={styles.statLabel}>Días Aprendiendo</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['rgba(94, 96, 206, 0.1)', 'rgba(106, 103, 206, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statContent}
              >
                <View style={[styles.statIconContainer, styles.statIconAccent]}>
                  <Ionicons name="flame-outline" size={22} color={COLORS.accent} />
                </View>
                <Text style={[styles.statValue, styles.statValueAccent]}>{stats.activitiesCompleted}</Text>
                <Text style={styles.statLabel}>Actividades Completadas</Text>
              </LinearGradient>
            </View>
          </View>
          
          <View style={styles.tipCard}>
            <View style={styles.tipIconContainer}>
              <Ionicons name="bulb-outline" size={24} color={COLORS.warning} />
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
                  colors={['rgba(74, 111, 255, 0.1)', 'rgba(54, 209, 220, 0.05)']}
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
          
          {/* Espacio al final */}
          <View style={styles.footer}></View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Mantener todos los estilos originales
  header: {
    paddingTop: 60,
    paddingBottom: 80,
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
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subGreeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',  // Asegura que la imagen se recorte en círculo
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  // Agregar estilo para la imagen de avatar
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
  contentInner: {
    padding: 20,
    paddingTop: 30, // Mayor espacio arriba
  },
  welcomeCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20, // Más espacio después del cuadro de bienvenida
  },
  welcomeCardContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 20,
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
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    marginBottom: 25,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
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
    color: COLORS.text,
    marginBottom: 4,
  },
  continueText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  activitiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 5, // Espacio adicional
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  activitiesCount: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 15,
    height: 120, // Tarjetas más grandes
    overflow: 'hidden',
  },
  menuCardGradient: {
    width: '100%',
    height: '100%',
  },
  menuCardOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20, // Mayor padding
  },
  menuIconContainer: {
    width: 64, // Íconos más grandes
    height: 64,
    borderRadius: 18,
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
    marginBottom: 8, // Más espacio entre título y descripción
  },
  menuDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
  },
  menuArrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25, // Más espacio
    marginTop: 15, // Espacio adicional arriba
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
  },
  statContent: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 111, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statIconAccent: {
    backgroundColor: 'rgba(94, 96, 206, 0.15)',
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
    backgroundColor: 'rgba(246, 173, 85, 0.1)',
    borderRadius: 16,
    padding: 18, // Padding mayor
    marginBottom: 30, // Más espacio abajo
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipIconContainer: {
    width: 44, // Ícono más grande
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(246, 173, 85, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 17, // Título más grande
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
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  recommendedCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 15,
  },
  recommendedContent: {
    padding: 18, // Padding mayor
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
  },
  footer: {
    height: 50, // Espacio al final
  }
});

export default MainMenuScreen;
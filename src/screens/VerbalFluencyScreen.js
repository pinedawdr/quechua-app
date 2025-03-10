// src/screens/VerbalFluencyScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import Header from '../components/Header';
import Loading from '../components/Loading';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, globalStyles } from '../styles/globalStyles';
import { LinearGradient } from 'expo-linear-gradient';

const VerbalFluencyScreen = ({ navigation }) => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        const exercisesCollection = collection(db, 'verbalExercises');
        const exercisesSnapshot = await getDocs(exercisesCollection);
        const exercisesList = exercisesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setExercises(exercisesList);
      } catch (error) {
        console.error('Error fetching exercises:', error);
        setError('No se pudieron cargar los ejercicios. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  const handleExerciseSelect = (exercise) => {
    navigation.navigate('VerbalExercise', { exerciseId: exercise.id });
  };

  const filters = [
    { id: 'all', label: 'Todos', icon: 'grid' },
    { id: 'pronunciation', label: 'Pronunciación', icon: 'mic' },
    { id: 'vocabulary', label: 'Vocabulario', icon: 'book' },
    { id: 'conversation', label: 'Conversación', icon: 'chatbubbles' }
  ];

  const filteredExercises = activeFilter === 'all' 
    ? exercises 
    : exercises.filter(exercise => exercise.type === activeFilter);

  if (loading) {
    return <Loading message="Cargando ejercicios..." />;
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <LinearGradient
        colors={COLORS.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Header 
          title="Fluidez Verbal" 
          showBack={true} 
          onBackPress={() => navigation.goBack()} 
        />
      </LinearGradient>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <>
          <View style={styles.headerContainer}>
            <Text style={styles.subtitle}>
              Mejora tu pronunciación y fluidez verbal en quechua
            </Text>
            <Text style={styles.description}>
              Estos ejercicios te ayudarán a mejorar tu dominio del idioma a través de la práctica oral.
            </Text>
          </View>
          
          <View style={styles.filterContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.filterScroll}
            >
              {filters.map(filter => (
                <TouchableOpacity 
                  key={filter.id} 
                  style={[
                    styles.filterButton,
                    activeFilter === filter.id && styles.filterButtonActive
                  ]}
                  onPress={() => setActiveFilter(filter.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name={filter.icon} 
                    size={18} 
                    color={activeFilter === filter.id ? 'white' : COLORS.textLight} 
                    style={styles.filterIcon}
                  />
                  <Text style={[
                    styles.filterText,
                    activeFilter === filter.id && styles.filterTextActive
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          {exercises.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="mic" size={60} color={COLORS.textLight} />
              <Text style={styles.emptyText}>
                No hay ejercicios disponibles en este momento. Vuelve más tarde.
              </Text>
            </View>
          ) : filteredExercises.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="filter" size={60} color={COLORS.textLight} />
              <Text style={styles.emptyText}>
                No hay ejercicios disponibles en esta categoría. Prueba con otra.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.exerciseCard}
                  onPress={() => handleExerciseSelect(item)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={getExerciseGradient(item.type)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.exerciseIconContainer}
                  >
                    <Ionicons 
                      name={getExerciseIcon(item.type)} 
                      size={24} 
                      color="white" 
                    />
                  </LinearGradient>
                  
                  <View style={styles.exerciseDetails}>
                    <Text style={styles.exerciseTitle}>{item.title}</Text>
                    <Text style={styles.exerciseDescription}>
                      {item.description || 'Practica tu pronunciación en quechua'}
                    </Text>
                    
                    <View style={styles.exerciseMetadata}>
                      <View style={styles.metadataItem}>
                        <Ionicons name="time" size={14} color={COLORS.textLight} />
                        <Text style={styles.metadataText}>
                          {item.duration || '5-10'} min
                        </Text>
                      </View>
                      
                      <View style={styles.metadataItem}>
                        <Ionicons name="analytics" size={14} color={COLORS.textLight} />
                        <Text style={styles.metadataText}>
                          {getExerciseDifficulty(item.difficulty)}
                        </Text>
                      </View>
                      
                      <View style={styles.tagContainer}>
                        <Text style={styles.tagText}>
                          {getTypeLabel(item.type)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listContent}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
};

// Funciones auxiliares
const getExerciseGradient = (type) => {
  switch(type) {
    case 'pronunciation':
      return ['#36D1DC', '#5B86E5'];
    case 'vocabulary':
      return ['#7C5CEF', '#5B86E5'];
    case 'conversation':
      return ['#FF9E80', '#FF6E40'];
    default:
      return COLORS.gradient;
  }
};

const getExerciseIcon = (type) => {
  switch(type) {
    case 'pronunciation':
      return 'mic';
    case 'vocabulary':
      return 'book';
    case 'conversation':
      return 'chatbubbles';
    default:
      return 'mic';
  }
};

const getExerciseDifficulty = (difficulty) => {
  switch(difficulty) {
    case 'easy':
      return 'Básico';
    case 'medium':
      return 'Intermedio';
    case 'hard':
      return 'Avanzado';
    default:
      return 'Básico';
  }
};

const getTypeLabel = (type) => {
  switch(type) {
    case 'pronunciation':
      return 'Pronunciación';
    case 'vocabulary':
      return 'Vocabulario';
    case 'conversation':
      return 'Conversación';
    default:
      return 'Ejercicio';
  }
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  headerContainer: {
    padding: 20,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 22,
    marginBottom: 8,
  },
  filterContainer: {
    paddingVertical: 16,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterScroll: {
    paddingHorizontal: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterIcon: {
    marginRight: 6,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  filterTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  exerciseCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exerciseIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  exerciseDetails: {
    flex: 1,
    marginRight: 10,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 6,
  },
  exerciseDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
    marginBottom: 12,
  },
  exerciseMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  metadataText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  tagContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(91, 134, 229, 0.1)',
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
    maxWidth: '80%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
    maxWidth: '80%',
  },
});

export default VerbalFluencyScreen;
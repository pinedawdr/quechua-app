// src/screens/InteractiveNarrativesScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, SafeAreaView } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import Header from '../components/Header';
import Loading from '../components/Loading';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, globalStyles } from '../styles/globalStyles';
import { LinearGradient } from 'expo-linear-gradient';

const InteractiveNarrativesScreen = ({ navigation }) => {
  const [narratives, setNarratives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchNarratives = async () => {
      try {
        setLoading(true);
        const narrativesCollection = collection(db, 'narratives');
        const narrativesSnapshot = await getDocs(narrativesCollection);
        const narrativesList = narrativesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNarratives(narrativesList);
      } catch (error) {
        console.error('Error fetching narratives:', error);
        setError('No se pudieron cargar las narrativas. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchNarratives();
  }, []);

  const handleNarrativeSelect = (narrative) => {
    navigation.navigate('InteractiveNarrative', { narrativeId: narrative.id });
  };

  const categories = [
    { id: 'all', name: 'Todas', icon: 'apps' },
    { id: 'adventure', name: 'Aventura', icon: 'compass' },
    { id: 'culture', name: 'Cultura', icon: 'earth' },
    { id: 'daily', name: 'Cotidiano', icon: 'home' }
  ];

  const filteredNarratives = selectedCategory === 'all' 
    ? narratives 
    : narratives.filter(narrative => narrative.category === selectedCategory);

  if (loading) {
    return <Loading message="Cargando narrativas..." />;
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
          title="Narrativas Interactivas" 
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
              Historias interactivas donde tú decides el rumbo
            </Text>
            <Text style={styles.description}>
              Practica la comprensión y toma de decisiones en quechua a través de estas narrativas inmersivas.
            </Text>
            
            <View style={styles.categoriesContainer}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.id && styles.activeCategoryButton
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Ionicons 
                    name={category.icon} 
                    size={16} 
                    color={selectedCategory === category.id ? 'white' : COLORS.textLight} 
                    style={styles.categoryIcon}
                  />
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.activeCategoryText
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {narratives.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="book" size={60} color={COLORS.textLight} />
              <Text style={styles.emptyText}>
                No hay narrativas disponibles en este momento. Vuelve más tarde.
              </Text>
            </View>
          ) : filteredNarratives.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="filter" size={60} color={COLORS.textLight} />
              <Text style={styles.emptyText}>
                No hay narrativas disponibles en esta categoría. Prueba con otra.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredNarratives}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.narrativeCard}
                  onPress={() => handleNarrativeSelect(item)}
                  activeOpacity={0.9}
                >
                  <Image 
                    source={{ uri: item.coverImage }} 
                    style={styles.narrativeImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.gradientOverlay}
                  >
                    <View style={styles.narrativeContent}>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>
                          {getCategoryName(item.category)}
                        </Text>
                      </View>
                      <Text style={styles.narrativeTitle}>{item.title}</Text>
                      <Text style={styles.narrativeDescription} numberOfLines={2}>
                        {item.description || 'Explora esta historia interactiva en quechua'}
                      </Text>
                      
                      <View style={styles.narrativeMetadata}>
                        <View style={styles.metadataItem}>
                          <Ionicons name="time" size={14} color="rgba(255,255,255,0.8)" />
                          <Text style={styles.metadataText}>
                            {item.duration || '10-15'} min
                          </Text>
                        </View>
                        
                        <View style={styles.metadataItem}>
                          <Ionicons name="git-branch" size={14} color="rgba(255,255,255,0.8)" />
                          <Text style={styles.metadataText}>
                            {item.choices || 'Múltiples'} decisiones
                          </Text>
                        </View>
                      </View>
                      <View style={styles.startButton}>
                        <Text style={styles.startButtonText}>Comenzar</Text>
                        <Ionicons name="arrow-forward" size={16} color="white" />
                      </View>
                    </View>
                  </LinearGradient>
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

// Función auxiliar para obtener el nombre de la categoría
const getCategoryName = (categoryId) => {
  switch(categoryId) {
    case 'adventure':
      return 'Aventura';
    case 'culture':
      return 'Cultura';
    case 'daily':
      return 'Cotidiano';
    default:
      return 'Historia';
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
    lineHeight: 20,
    marginBottom: 20,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    marginRight: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryIcon: {
    marginRight: 6,
  },
  activeCategoryButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  activeCategoryText: {
    color: 'white',
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  narrativeCard: {
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  narrativeImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
    justifyContent: 'flex-end',
    padding: 20,
  },
  narrativeContent: {
    width: '100%',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  categoryBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  narrativeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  narrativeDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
    lineHeight: 20,
  },
  narrativeMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  metadataText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 5,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  startButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
    marginRight: 5,
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
    marginTop: 15,
    lineHeight: 24,
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

export default InteractiveNarrativesScreen;
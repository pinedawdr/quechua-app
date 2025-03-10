// src/screens/ReadingActivitiesScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, SafeAreaView } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import Card from '../components/Card';
import Header from '../components/Header';
import Loading from '../components/Loading';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, globalStyles } from '../styles/globalStyles';
import { LinearGradient } from 'expo-linear-gradient';

const ReadingActivitiesScreen = ({ navigation }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentCategory, setCurrentCategory] = useState('all');

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const booksCollection = collection(db, 'books');
        const booksSnapshot = await getDocs(booksCollection);
        const booksList = booksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBooks(booksList);
      } catch (error) {
        console.error('Error fetching books:', error);
        setError('No se pudieron cargar los libros. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const handleBookSelect = (book) => {
    navigation.navigate('BookReader', { bookId: book.id });
  };

  const categories = [
    { id: 'all', label: 'Todos', icon: 'grid' },
    { id: 'easy', label: 'Nivel Básico', icon: 'star' },
    { id: 'medium', label: 'Nivel Medio', icon: 'star-half' },
    { id: 'advanced', label: 'Avanzado', icon: 'stars' }
  ];

  const filteredBooks = currentCategory === 'all' 
    ? books 
    : books.filter(book => book.level === currentCategory);

  const renderCategoryButton = (category) => {
    const isActive = currentCategory === category.id;
    return (
      <TouchableOpacity
        key={category.id}
        style={[styles.categoryButton, isActive && styles.categoryButtonActive]}
        onPress={() => setCurrentCategory(category.id)}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={category.icon} 
          size={16} 
          color={isActive ? 'white' : COLORS.textLight} 
          style={styles.categoryIcon}
        />
        <Text style={[styles.categoryButtonText, isActive && styles.categoryButtonTextActive]}>
          {category.label}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <Loading message="Cargando libros..." />;
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
          title="Actividades de Lectura" 
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
              Practica tu lectura en quechua con estos libros interactivos
            </Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="book" size={18} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.statValue}>{books.length}</Text>
                  <Text style={styles.statLabel}>Libros</Text>
                </View>
              </View>
              
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, {backgroundColor: 'rgba(124, 92, 239, 0.15)'}]}>
                  <Ionicons name="school" size={18} color={COLORS.accent} />
                </View>
                <View>
                  <Text style={[styles.statValue, {color: COLORS.accent}]}>3</Text>
                  <Text style={styles.statLabel}>Niveles</Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.categoriesContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.categoriesScrollContent}
            >
              {categories.map(category => renderCategoryButton(category))}
            </ScrollView>
          </View>
          
          {books.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="book" size={60} color={COLORS.textLight} />
              <Text style={styles.emptyText}>
                No hay libros disponibles en este momento. Vuelve más tarde.
              </Text>
            </View>
          ) : filteredBooks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="filter" size={60} color={COLORS.textLight} />
              <Text style={styles.emptyText}>
                No hay libros disponibles en esta categoría. Prueba con otra.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredBooks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Card
                  title={item.title}
                  description={item.description || 'Toca para comenzar a leer'}
                  imageUrl={item.coverImage}
                  onPress={() => handleBookSelect(item)}
                  extraInfo={
                    <View style={styles.bookInfo}>
                      <View style={styles.levelBadge}>
                        <Text style={styles.levelText}>
                          {item.level === 'easy' ? 'Básico' : 
                           item.level === 'medium' ? 'Medio' : 'Avanzado'}
                        </Text>
                      </View>
                      <View style={styles.pageInfo}>
                        <Ionicons name="document-text" size={14} color={COLORS.textLight} />
                        <Text style={styles.pageText}>
                          {item.pages?.length || 0} páginas
                        </Text>
                      </View>
                    </View>
                  }
                />
              )}
              contentContainerStyle={styles.listContent}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 16,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 5,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 25,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(91, 134, 229, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  categoriesContainer: {
    backgroundColor: COLORS.background,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoriesScrollContent: {
    paddingHorizontal: 15,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryButtonText: {
    color: COLORS.textLight,
    fontWeight: '600',
    fontSize: 14,
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
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
    marginTop: 15,
    lineHeight: 24,
  },
  bookInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  levelBadge: {
    backgroundColor: 'rgba(91, 134, 229, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  pageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  pageText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 4,
  },
});

export default ReadingActivitiesScreen;
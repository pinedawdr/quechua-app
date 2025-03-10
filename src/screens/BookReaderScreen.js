// src/screens/BookReaderScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import Header from '../components/Header';
import Button from '../components/Button';
import Loading from '../components/Loading';
import useContentStore from '../store/contentStore';
import useProgressStore from '../store/progressStore';
import useAuthStore from '../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, globalStyles } from '../styles/globalStyles';
import { LinearGradient } from 'expo-linear-gradient';

const BookReaderScreen = ({ route, navigation }) => {
  const { bookId } = route.params;
  const [book, setBook] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const { user, isGuest } = useAuthStore();
  const updateReadingProgress = useProgressStore(state => state.updateReadingProgress);
  
  useEffect(() => {
    const fetchBook = async () => {
      try {
        const bookDoc = await getDoc(doc(db, 'books', bookId));
        if (bookDoc.exists()) {
          setBook(bookDoc.data());
          
          // Check for saved progress if user is logged in
          if (!isGuest && user) {
            const progressDoc = await getDoc(doc(db, 'users', user.uid, 'reading', bookId));
            if (progressDoc.exists()) {
              setCurrentPage(progressDoc.data().currentPage || 0);
            }
          }
        } else {
          console.error('No such document!');
        }
      } catch (error) {
        console.error('Error fetching book:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBook();
  }, [bookId, user, isGuest]);
  
  const handleNextPage = () => {
    if (!book || currentPage >= book.pages.length - 1) return;
    
    const newPage = currentPage + 1;
    setCurrentPage(newPage);
    saveProgress(newPage);
  };
  
  const handlePrevPage = () => {
    if (currentPage <= 0) return;
    
    const newPage = currentPage - 1;
    setCurrentPage(newPage);
    saveProgress(newPage);
  };
  
  const saveProgress = async (pageNumber) => {
    // Update local state
    updateReadingProgress(bookId, {
      currentPage: pageNumber,
      totalPages: book?.pages?.length || 0,
      lastRead: new Date().toISOString(),
    });
    
    // Save to Firestore if user is logged in
    if (!isGuest && user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'reading', bookId), {
          currentPage: pageNumber,
          lastRead: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    }
  };
  
  const handleFinishReading = () => {
    console.log('Navigating to quiz for book ID:', bookId);
    navigation.navigate('BookQuiz', { bookId });
  };
  
  const toggleTranslation = () => {
    setShowTranslation(!showTranslation);
  };
  
  if (loading) {
    return <Loading message="Cargando libro..." />;
  }
  
  if (!book) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <LinearGradient
          colors={COLORS.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Header 
            title="Error" 
            showBack={true} 
            onBackPress={() => navigation.goBack()} 
          />
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color={COLORS.error} />
          <Text style={styles.errorText}>
            No se pudo cargar el libro. Por favor, intenta nuevamente.
          </Text>
          <Button 
            title="Volver a la lista" 
            onPress={() => navigation.goBack()}
            style={{marginTop: 20}}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  const currentPageData = book.pages[currentPage];
  const isLastPage = currentPage === book.pages.length - 1;
  
  return (
    <SafeAreaView style={globalStyles.container}>
      <LinearGradient
        colors={COLORS.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Header 
          title={book.title} 
          showBack={true} 
          onBackPress={() => navigation.goBack()} 
        />
      </LinearGradient>
      
      <View style={styles.pageIndicator}>
        <View style={styles.pageIndicatorContent}>
          <View style={styles.pageNumberBox}>
            <Text style={styles.pageNumberText}>{currentPage + 1}</Text>
          </View>
          <Text style={styles.pageIndicatorText}>
            Página {currentPage + 1} de {book.pages.length}
          </Text>
          
          <TouchableOpacity 
            style={styles.translationToggle}
            onPress={toggleTranslation}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={showTranslation ? "eye" : "eye-off"} 
              size={18} 
              color={COLORS.primary} 
            />
            <Text style={styles.translationToggleText}>
              {showTranslation ? "Ocultar español" : "Mostrar español"}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentPage + 1) / book.pages.length) * 100}%` }
            ]} 
          />
        </View>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.bookContent}>
          {currentPageData.image && (
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: currentPageData.image }} 
                style={styles.pageImage}
                resizeMode="contain"
              />
            </View>
          )}
          
          <View style={styles.textContent}>
            <Text style={styles.quechuaText}>{currentPageData.quechuaText}</Text>
            
            {showTranslation && (
              <View style={styles.translationContainer}>
                <Text style={styles.translationLabel}>Traducción:</Text>
                <Text style={styles.spanishText}>{currentPageData.spanishText}</Text>
              </View>
            )}
            
            {currentPageData.notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>Notas:</Text>
                <Text style={styles.notesText}>{currentPageData.notes}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.navigationButtons}>
        <TouchableOpacity 
          style={[styles.navButton, currentPage === 0 && styles.disabledButton]}
          onPress={handlePrevPage}
          disabled={currentPage === 0}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="chevron-back" 
            size={24} 
            color={currentPage === 0 ? COLORS.textLight : COLORS.primary} 
          />
          <Text style={[styles.navButtonText, currentPage === 0 && styles.disabledText]}>
            Anterior
          </Text>
        </TouchableOpacity>
        
        <View style={styles.pageIndicatorMini}>
          <Text style={styles.pageIndicatorMiniText}>{currentPage + 1}/{book.pages.length}</Text>
        </View>
        
        {isLastPage ? (
          <Button 
            title="Hacer Quiz" 
            onPress={handleFinishReading}
            icon={<Ionicons name="checkmark-circle" size={22} color="white" />}
            style={styles.finishButton}
          />
        ) : (
          <TouchableOpacity 
            style={styles.navButtonNext}
            onPress={handleNextPage}
            activeOpacity={0.8}
          >
            <Text style={styles.navButtonNextText}>Siguiente</Text>
            <Ionicons name="chevron-forward" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  pageIndicator: {
    padding: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pageIndicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pageNumberBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageNumberText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pageIndicatorText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  translationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(91, 134, 229, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  translationToggleText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 5,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  bookContent: {
    padding: 20,
  },
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pageImage: {
    width: '100%',
    height: 200,
  },
  textContent: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quechuaText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: COLORS.text,
    lineHeight: 32,
  },
  translationContainer: {
    backgroundColor: 'rgba(91, 134, 229, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  translationLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  spanishText: {
    fontSize: 16,
    color: COLORS.text,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  notesContainer: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.warning,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(91, 134, 229, 0.1)',
  },
  navButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  disabledText: {
    color: COLORS.textLight,
  },
  navButtonNext: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  navButtonNextText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 5,
  },
  pageIndicatorMini: {
    backgroundColor: COLORS.background,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pageIndicatorMiniText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  finishButton: {
    minWidth: 140,
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
    marginBottom: 10,
    lineHeight: 24,
  },
});

export default BookReaderScreen;
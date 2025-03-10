// src/screens/InteractiveNarrativeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import Header from '../components/Header';
import Button from '../components/Button';
import Loading from '../components/Loading';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, globalStyles } from '../styles/globalStyles';
import { LinearGradient } from 'expo-linear-gradient';

const InteractiveNarrativeScreen = ({ route, navigation }) => {
  const { narrativeId } = route.params;
  const [narrative, setNarrative] = useState(null);
  const [currentScene, setCurrentScene] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNarrative = async () => {
      try {
        setLoading(true);
        const narrativeDoc = await getDoc(doc(db, 'narratives', narrativeId));
        if (narrativeDoc.exists()) {
          setNarrative(narrativeDoc.data());
        } else {
          setError('No se encontró la narrativa solicitada');
        }
      } catch (error) {
        console.error('Error fetching narrative:', error);
        setError('Error al cargar la narrativa. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchNarrative();
  }, [narrativeId]);

  const handleChoiceSelect = (choice) => {
    // Guardar escena actual en historial
    setHistory([...history, currentScene]);
    
    // Navegar a la siguiente escena o finalizar
    if (choice.nextScene >= narrative.scenes.length) {
      // Escena final - completar narrativa
      navigation.navigate('NarrativeCompletion', { 
        narrativeTitle: narrative.title 
      });
    } else {
      // Avanzar a la escena seleccionada
      setCurrentScene(choice.nextScene);
    }
  };

  const handleGoBack = () => {
    if (history.length > 0) {
      // Recuperar escena anterior del historial
      const newHistory = [...history];
      const previousScene = newHistory.pop();
      setHistory(newHistory);
      setCurrentScene(previousScene);
    } else {
      // Si no hay historial, volver a la pantalla anterior
      navigation.goBack();
    }
  };

  if (loading) {
    return <Loading message="Cargando narrativa..." />;
  }

  if (error || !narrative || !narrative.scenes || narrative.scenes.length === 0) {
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
            {error || 'Esta narrativa no tiene escenas disponibles'}
          </Text>
          <Button 
            title="Volver a narrativas" 
            onPress={() => navigation.goBack()}
            style={{marginTop: 20}}
          />
        </View>
      </SafeAreaView>
    );
  }

  const scene = narrative.scenes[currentScene];

  return (
    <SafeAreaView style={globalStyles.container}>
      <LinearGradient
        colors={COLORS.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Header 
          title={narrative.title} 
          showBack={true} 
          onBackPress={handleGoBack} 
        />
      </LinearGradient>
      
      <ScrollView style={styles.content}>
        <View style={styles.sceneProgressContainer}>
          <View style={styles.sceneProgressBar}>
            <View 
              style={[
                styles.sceneProgressFill, 
                { width: `${((currentScene + 1) / narrative.scenes.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.sceneProgressText}>
            Escena {currentScene + 1} de {narrative.scenes.length}
          </Text>
        </View>
        
        {scene.image && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: scene.image }} 
              style={styles.sceneImage}
              resizeMode="cover"
            />
          </View>
        )}
        
        <View style={styles.sceneContent}>
          <Text style={styles.quechuaText}>{scene.quechuaText}</Text>
          <Text style={styles.spanishText}>{scene.spanishText}</Text>
          
          {scene.choices && scene.choices.length > 0 && (
            <View style={styles.choicesContainer}>
              <Text style={styles.choicesTitle}>¿Qué harás ahora?</Text>
              
              {scene.choices.map((choice, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.choiceOption}
                  onPress={() => handleChoiceSelect(choice)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['rgba(91, 134, 229, 0.1)', 'rgba(124, 92, 239, 0.05)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.choiceGradient}
                  >
                    <Text style={styles.choiceQuechua}>{choice.quechuaText}</Text>
                    <Text style={styles.choiceSpanish}>{choice.spanishText}</Text>
                    <View style={styles.choiceArrow}>
                      <Ionicons name="arrow-forward" size={18} color={COLORS.primary} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  content: {
    flex: 1,
  },
  sceneProgressContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sceneProgressBar: {
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sceneProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  sceneProgressText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  imageContainer: {
    borderRadius: 0,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sceneImage: {
    width: '100%',
    height: 200,
  },
  sceneContent: {
    padding: 20,
  },
  quechuaText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    lineHeight: 28,
    backgroundColor: 'rgba(91, 134, 229, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  spanishText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: COLORS.textLight,
    marginBottom: 30,
    lineHeight: 24,
    padding: 16,
  },
  choicesContainer: {
    marginTop: 10,
  },
  choicesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    paddingVertical: 8,
    borderRadius: 12,
  },
  choiceOption: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  choiceGradient: {
    borderRadius: 12,
    padding: 16,
    position: 'relative',
  },
  choiceQuechua: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  choiceSpanish: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  choiceArrow: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(91, 134, 229, 0.1)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default InteractiveNarrativeScreen;
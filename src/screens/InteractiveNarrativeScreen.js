// src/screens/InteractiveNarrativeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
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
      <View style={globalStyles.container}>
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
          <Ionicons name="alert-circle-outline" size={50} color={COLORS.error} />
          <Text style={styles.errorText}>
            {error || 'Esta narrativa no tiene escenas disponibles'}
          </Text>
        </View>
      </View>
    );
  }

  const scene = narrative.scenes[currentScene];

  return (
    <View style={globalStyles.container}>
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
        {scene.image && (
          <Image 
            source={{ uri: scene.image }} 
            style={styles.sceneImage}
            resizeMode="cover"
          />
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
                    colors={['rgba(74, 111, 255, 0.1)', 'rgba(94, 96, 206, 0.05)']}
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
    </View>
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
    marginBottom: 15,
    lineHeight: 28,
  },
  spanishText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: COLORS.textLight,
    marginBottom: 30,
    lineHeight: 24,
  },
  choicesContainer: {
    marginTop: 10,
  },
  choicesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  choiceOption: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  choiceGradient: {
    borderRadius: 12,
    padding: 15,
    position: 'relative',
  },
  choiceQuechua: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  choiceSpanish: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 5,
  },
  choiceArrow: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -9 }],
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
});

export default InteractiveNarrativeScreen;
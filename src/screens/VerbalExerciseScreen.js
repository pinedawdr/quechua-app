// src/screens/VerbalExerciseScreen.js
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import Button from '../components/Button';
import Loading from '../components/Loading';
import useProgressStore from '../store/progressStore';
import useAuthStore from '../store/authStore';
import { COLORS, globalStyles } from '../styles/globalStyles';
import { LinearGradient } from 'expo-linear-gradient';

const VerbalExerciseScreen = ({ route, navigation }) => {
  const { exerciseId } = route.params;
  const [exercise, setExercise] = useState(null);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exampleSound, setExampleSound] = useState(null);
  const [showTip, setShowTip] = useState(true);
  const [playingExample, setPlayingExample] = useState(false);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [error, setError] = useState(null);
  
  const { user, isGuest } = useAuthStore();
  const updateVerbalFluencyProgress = useProgressStore(state => state.updateVerbalFluencyProgress);
  const addMedal = useProgressStore(state => state.addMedal);
  
  useEffect(() => {
    const fetchExercise = async () => {
      try {
        console.log('Fetching exercise with ID:', exerciseId);
        const exerciseDoc = await getDoc(doc(db, 'verbalExercises', exerciseId));
        if (exerciseDoc.exists()) {
          console.log('Exercise found:', exerciseDoc.data());
          setExercise(exerciseDoc.data());
        } else {
          console.error('No exercise found with this ID:', exerciseId);
          setError('No se encontró el ejercicio con este ID');
        }
      } catch (error) {
        console.error('Error fetching exercise:', error);
        setError('Error al cargar el ejercicio: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExercise();
    setupAudio();
    
    return () => {
      // Clean up sounds when component unmounts
      if (sound) {
        sound.stopAsync().then(() => sound.unloadAsync());
      }
      if (exampleSound) {
        exampleSound.stopAsync().then(() => exampleSound.unloadAsync());
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [exerciseId]);
  
  const setupAudio = async () => {
    try {
      // Solicitar permisos de grabación
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'No se puede grabar audio sin permiso.');
        return;
      }
      
      // Configurar el modo de audio - CORREGIDO CON VALORES DIRECTOS
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        // Usando valores numéricos directos en lugar de constantes
        interruptionModeIOS: 1, // 1 = DO_NOT_MIX
        interruptionModeAndroid: 1, // 1 = DO_NOT_MIX
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      console.log('Audio setup successful');
    } catch (error) {
      console.error('Error setting up audio:', error);
      // Más detalle en el mensaje de error
      Alert.alert('Error', 'No se pudo configurar el sistema de audio: ' + error.message);
    }
  };
  
  const startRecording = async () => {
    try {
      // Asegurarnos de haber liberado la grabación anterior
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }
      
      // Pausar cualquier reproducción
      if (playingExample && exampleSound) {
        await exampleSound.pauseAsync();
        setPlayingExample(false);
      }
      
      if (isPlayingRecording && sound) {
        await sound.pauseAsync();
        setIsPlayingRecording(false);
      }
      
      // Crear una nueva grabación
      console.log('Starting recording...');
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording', error);
      Alert.alert('Error', 'No se pudo iniciar la grabación: ' + error.message);
    }
  };
  
  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      console.log('Stopping recording...');
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('Recording stopped, URI:', uri);
      
      setRecording(null);
      
      if (uri) {
        loadRecordedSound(uri);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'No se pudo detener la grabación: ' + error.message);
    }
  };
  
  const loadRecordedSound = async (uri) => {
    try {
      console.log('Loading recorded sound from URI:', uri);
      
      // Liberar el sonido anterior si existe
      if (sound) {
        await sound.unloadAsync();
      }
      
      // Cargar el nuevo sonido
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false }
      );
      
      setSound(newSound);
      console.log('Recorded sound loaded successfully');
    } catch (error) {
      console.error('Error loading recorded sound:', error);
      Alert.alert('Error', 'No se pudo cargar la grabación: ' + error.message);
    }
  };
  
  const playRecording = async () => {
    if (!sound) return;
    
    try {
      // Si ya está reproduciendo, lo pausamos
      if (isPlayingRecording) {
        console.log('Pausing recording...');
        await sound.pauseAsync();
        setIsPlayingRecording(false);
      } else {
        // Si el audio de ejemplo está sonando, lo pausamos primero
        if (playingExample && exampleSound) {
          await exampleSound.pauseAsync();
          setPlayingExample(false);
        }
        
        console.log('Playing recording...');
        
        // Configurar el callback para cuando termine
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setIsPlayingRecording(false);
          }
        });
        
        await sound.replayAsync();
        setIsPlayingRecording(true);
      }
    } catch (error) {
      console.error('Error playing recording:', error);
      setIsPlayingRecording(false);
      Alert.alert('Error', 'No se pudo reproducir la grabación: ' + error.message);
    }
  };
  
  const playExample = async () => {
    if (!exercise || !exercise.words[currentWordIndex].audioUrl) {
      Alert.alert('Error', 'No hay audio de ejemplo disponible para esta palabra.');
      return;
    }
    
    try {
      // Si ya está reproduciendo, lo pausamos
      if (playingExample && exampleSound) {
        console.log('Pausing example...');
        await exampleSound.pauseAsync();
        setPlayingExample(false);
        return;
      }
      
      // Si la grabación está sonando, la pausamos primero
      if (isPlayingRecording && sound) {
        await sound.pauseAsync();
        setIsPlayingRecording(false);
      }
      
      setPlayingExample(true);
      
      // Unload previous example if exists
      if (exampleSound) {
        await exampleSound.unloadAsync();
      }
      
      console.log('Loading example audio from URL:', exercise.words[currentWordIndex].audioUrl);
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: exercise.words[currentWordIndex].audioUrl },
        { shouldPlay: true },
        (status) => {
          if (status.didJustFinish) {
            setPlayingExample(false);
          }
        }
      );
      
      setExampleSound(newSound);
    } catch (error) {
      console.error('Error playing example:', error);
      setPlayingExample(false);
      Alert.alert('Error', 'No se pudo reproducir el ejemplo de audio: ' + error.message);
    }
  };
  
  const handleNextWord = () => {
    // Asegurarse de detener todas las reproducciones en curso
    if (sound) {
      sound.stopAsync().then(() => sound.unloadAsync());
      setSound(null);
      setIsPlayingRecording(false);
    }
    
    if (exampleSound) {
      exampleSound.stopAsync().then(() => exampleSound.unloadAsync());
      setExampleSound(null);
      setPlayingExample(false);
    }
    
    if (currentWordIndex < exercise.words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setShowTip(false); // Hide the tip after first word
    } else {
      completeExercise();
    }
  };
  
  const completeExercise = () => {
    setCompleted(true);
    
    // Save progress
    updateVerbalFluencyProgress(exerciseId, 100);
    
    // Add medal
    const medal = {
      id: `verbal_${exerciseId}`,
      type: 'verbal',
      title: 'Hablante de Quechua',
      description: 'Completaste exitosamente un ejercicio de fluidez verbal',
      date: new Date().toISOString()
    };
    addMedal(medal);
    
    // Save to Firestore if user is logged in
    if (!isGuest && user) {
      try {
        setDoc(doc(db, 'users', user.uid, 'verbalExercises', exerciseId), {
          completed: true,
          completedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error saving exercise progress:', error);
      }
    }
  };
  
  const handleFinish = () => {
    navigation.navigate('VerbalFluency');
  };
  
  if (loading) {
    return <Loading message="Cargando ejercicio..." />;
  }
  
  if (error || !exercise) {
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
            {error || 'No se encontró el ejercicio. Por favor, intenta con otro ejercicio.'}
          </Text>
          <Button 
            title="Volver a la lista de ejercicios" 
            onPress={() => navigation.navigate('VerbalFluency')}
            style={{ marginTop: 20 }}
          />
        </View>
      </View>
    );
  }
  
  if (completed) {
    return (
      <View style={globalStyles.container}>
        <LinearGradient
          colors={COLORS.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Header 
            title="¡Completado!" 
            showBack={false}
          />
        </LinearGradient>
        
        <View style={styles.completedContainer}>
          <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
          <Text style={styles.completedTitle}>¡Excelente trabajo!</Text>
          <Text style={styles.completedText}>
            Has completado el ejercicio de fluidez verbal.
          </Text>
          
          <View style={styles.resultsCard}>
            <View style={styles.resultRow}>
              <View style={styles.resultIcon}>
                <Ionicons name="create-outline" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.resultInfo}>
                <Text style={styles.resultTitle}>Ejercicio</Text>
                <Text style={styles.resultValue}>{exercise.title}</Text>
              </View>
            </View>
            
            <View style={styles.resultRow}>
              <View style={styles.resultIcon}>
                <Ionicons name="text-outline" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.resultInfo}>
                <Text style={styles.resultTitle}>Palabras practicadas</Text>
                <Text style={styles.resultValue}>{exercise.words.length}</Text>
              </View>
            </View>
            
            <View style={styles.resultRow}>
              <View style={styles.resultIcon}>
                <Ionicons name="time-outline" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.resultInfo}>
                <Text style={styles.resultTitle}>Tiempo estimado</Text>
                <Text style={styles.resultValue}>{exercise.words.length * 3} minutos</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.medalContainer}>
            <Ionicons name="mic" size={50} color={COLORS.accent} style={styles.medalIcon} />
            <Text style={styles.medalText}>¡Has ganado una medalla!</Text>
            <Text style={styles.medalTitle}>Hablante de Quechua</Text>
          </View>
          
          <Button 
            title="Finalizar" 
            onPress={handleFinish}
            icon={<Ionicons name="checkmark-circle-outline" size={22} color="white" />}
            style={{ marginTop: 30 }}
          />
        </View>
      </View>
    );
  }
  
  const currentWord = exercise.words[currentWordIndex];
  
  return (
    <View style={globalStyles.container}>
      <LinearGradient
        colors={COLORS.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Header 
          title={exercise.title} 
          showBack={true} 
          onBackPress={() => navigation.goBack()} 
        />
      </LinearGradient>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentWordIndex + 1) / exercise.words.length) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          Palabra {currentWordIndex + 1} de {exercise.words.length}
        </Text>
      </View>
      
      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentScrollInner}>
        <View style={styles.wordContainer}>
          <Text style={styles.quechuaWord}>{currentWord.quechuaText}</Text>
          <Text style={styles.spanishTranslation}>{currentWord.spanishText}</Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.playExampleButton,
            playingExample && styles.playingButton
          ]}
          onPress={playExample}
        >
          <Ionicons 
            name={playingExample ? "pause" : "volume-high-outline"} 
            size={24} 
            color="white" 
          />
          <Text style={styles.playExampleText}>
            {playingExample ? "Pausar" : "Escuchar ejemplo"}
          </Text>
        </TouchableOpacity>
        
        {showTip && (
          <View style={styles.tipContainer}>
            <Ionicons name="bulb-outline" size={24} color={COLORS.warning} />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Consejo</Text>
              <Text style={styles.tipText}>
                Intenta repetir la palabra varias veces hasta que suene similar al ejemplo. 
                Presta atención a la entonación.
              </Text>
            </View>
          </View>
        )}
        
        <View style={styles.recordingControls}>
          <TouchableOpacity 
            style={[
              styles.recordButton, 
              isRecording && styles.recordingActive
            ]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Ionicons 
              name={isRecording ? "stop" : "mic"} 
              size={40} 
              color="white" 
            />
          </TouchableOpacity>
          
          <Text style={styles.recordInstructions}>
            {isRecording 
              ? "Grabando... Toca para detener" 
              : "Toca el micrófono para grabar tu voz"
            }
          </Text>
          
          {sound && (
            <View style={styles.soundControls}>
              <TouchableOpacity 
                style={[
                  styles.playButton,
                  isPlayingRecording && styles.playingButton
                ]}
                onPress={playRecording}
              >
                <Ionicons name={isPlayingRecording ? "pause" : "play"} size={24} color="white" />
                <Text style={styles.playButtonText}>
                  {isPlayingRecording ? "Pausar grabación" : "Reproducir tu grabación"}
                </Text>
              </TouchableOpacity>
              
              <View style={styles.compareContainer}>
                <View style={styles.compareDivider} />
                <Text style={styles.compareText}>Compara con el ejemplo</Text>
                <View style={styles.compareDivider} />
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.exampleAudioButton,
                  playingExample && styles.playingButton
                ]}
                onPress={playExample}
              >
                <Ionicons name={playingExample ? "pause" : "volume-high"} size={24} color="white" />
                <Text style={styles.exampleAudioText}>
                  {playingExample ? "Pausar ejemplo" : "Audio original"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <Button 
          title={currentWordIndex < exercise.words.length - 1 ? "Siguiente palabra" : "Finalizar ejercicio"} 
          onPress={handleNextWord}
          disabled={!sound}
          style={!sound ? styles.disabledButton : {}}
          icon={<Ionicons name="arrow-forward" size={22} color="white" />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  progressContainer: {
    padding: 20,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollInner: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  wordContainer: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 25,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quechuaWord: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  spanishTranslation: {
    fontSize: 18,
    color: COLORS.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  playExampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  playingButton: {
    backgroundColor: COLORS.warning,
  },
  playExampleText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
  },
  tipContainer: {
    backgroundColor: 'rgba(246, 173, 85, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 25,
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(246, 173, 85, 0.3)',
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.warning,
    marginBottom: 5,
  },
  tipText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  recordingControls: {
    alignItems: 'center',
    width: '100%',
  },
  recordButton: {
    backgroundColor: COLORS.primary,
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  recordingActive: {
    backgroundColor: COLORS.error,
  },
  recordInstructions: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 20,
    textAlign: 'center',
  },
  soundControls: {
    width: '100%',
    alignItems: 'center',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  playButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
  },
  compareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  compareDivider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  compareText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginHorizontal: 15,
  },
  exampleAudioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  exampleAudioText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
  },
  buttonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  disabledButton: {
    opacity: 0.5,
  },
  completedContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  completedText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 25,
  },
  resultsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 111, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  medalContainer: {
    backgroundColor: 'rgba(94, 96, 206, 0.1)',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    marginTop: 5,
    borderWidth: 1,
    borderColor: COLORS.accent,
    width: '100%',
  },
  medalIcon: {
    marginBottom: 15,
  },
  medalText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 5,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  medalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.accent,
    textAlign: 'center',
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
    marginBottom: 20,
  },
});

export default VerbalExerciseScreen;
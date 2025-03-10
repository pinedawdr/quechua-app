// src/screens/BookQuizScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import Header from '../components/Header';
import Button from '../components/Button';
import Loading from '../components/Loading';
import useProgressStore from '../store/progressStore';
import useAuthStore from '../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, globalStyles } from '../styles/globalStyles';
import { LinearGradient } from 'expo-linear-gradient';

const BookQuizScreen = ({ route, navigation }) => {
  const { bookId } = route.params;
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user, isGuest } = useAuthStore();
  const updateExerciseProgress = useProgressStore(state => state.updateExerciseProgress);
  const addMedal = useProgressStore(state => state.addMedal);
  
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        console.log('Fetching quiz with ID:', bookId); // Para depuración
        
        const quizDoc = await getDoc(doc(db, 'quizzes', bookId));
        if (quizDoc.exists()) {
          console.log('Quiz found:', quizDoc.data());
          setQuiz(quizDoc.data());
        } else {
          console.error('No quiz found for this book with ID:', bookId);
          setError('No se encontró ningún quiz para este libro.');
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
        setError('Error al cargar el quiz. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuiz();
  }, [bookId]);
  
  const handleSelectAnswer = (questionIndex, answerIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: answerIndex
    });
  };
  
  const handleNextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateScore();
    }
  };
  
  const calculateScore = () => {
    let correctAnswers = 0;
    
    quiz.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    
    const finalScore = Math.round((correctAnswers / quiz.questions.length) * 100);
    setScore(finalScore);
    setShowResults(true);
    
    // Save progress
    updateExerciseProgress(bookId, finalScore);
    
    // Add a medal if score is high enough
    if (finalScore >= 80) {
      const medal = {
        id: `quiz_${bookId}`,
        type: 'quiz',
        title: 'Experto en Lectura',
        description: `Completaste la lectura y quiz con una puntuación de ${finalScore}%`,
        date: new Date().toISOString()
      };
      addMedal(medal);
    }
    
    // Save to Firestore if user is logged in
    if (!isGuest && user) {
      try {
        setDoc(doc(db, 'users', user.uid, 'quizzes', bookId), {
          score: finalScore,
          completedAt: new Date().toISOString(),
          answers: selectedAnswers
        });
      } catch (error) {
        console.error('Error saving quiz results:', error);
      }
    }
  };
  
  const handleFinish = () => {
    navigation.navigate('ReadingActivities');
  };
  
  if (loading) {
    return <Loading message="Cargando quiz..." />;
  }
  
  if (error || !quiz) {
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
            {error || 'No se encontró el quiz para este libro. Por favor, intenta con otro libro.'}
          </Text>
          <Button 
            title="Volver a la lista de libros" 
            onPress={() => navigation.navigate('ReadingActivities')}
            style={{ marginTop: 20 }}
          />
        </View>
      </View>
    );
  }
  
  if (showResults) {
    return (
      <View style={globalStyles.container}>
        <LinearGradient
          colors={COLORS.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Header 
            title="Resultados" 
            showBack={false}
          />
        </LinearGradient>
        
        <ScrollView contentContainerStyle={styles.resultsContainer}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreTitle}>Tu puntuación:</Text>
            <Text style={styles.scoreValue}>{score}%</Text>
            
            <View style={styles.statsSection}>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                </View>
                <View style={styles.statText}>
                  <Text style={styles.statValue}>
                    {Object.keys(selectedAnswers).filter(key => 
                      selectedAnswers[key] === quiz.questions[key].correctAnswer
                    ).length}
                  </Text>
                  <Text style={styles.statLabel}>Correctas</Text>
                </View>
              </View>
              
              <View style={styles.statSeparator} />
              
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, {backgroundColor: 'rgba(245, 101, 101, 0.1)'}]}>
                  <Ionicons name="close-circle" size={20} color={COLORS.error} />
                </View>
                <View style={styles.statText}>
                  <Text style={[styles.statValue, {color: COLORS.error}]}>
                    {Object.keys(selectedAnswers).filter(key => 
                      selectedAnswers[key] !== quiz.questions[key].correctAnswer
                    ).length}
                  </Text>
                  <Text style={styles.statLabel}>Incorrectas</Text>
                </View>
              </View>
              
              <View style={styles.statSeparator} />
              
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, {backgroundColor: 'rgba(246, 173, 85, 0.1)'}]}>
                  <Ionicons name="help-circle" size={20} color={COLORS.warning} />
                </View>
                <View style={styles.statText}>
                  <Text style={[styles.statValue, {color: COLORS.warning}]}>
                    {quiz.questions.length}
                  </Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
              </View>
            </View>
          </View>
          
          {score >= 80 ? (
            <View style={styles.medalContainer}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.medalIconBackground}
              >
                <Ionicons name="trophy" size={50} color="white" style={styles.medalIcon} />
              </LinearGradient>
              <Text style={styles.medalText}>¡Felicidades! Has ganado una medalla</Text>
              <Text style={styles.medalTitle}>Experto en Lectura</Text>
              <Text style={styles.medalDescription}>
                Has demostrado una gran comprensión del contenido leído en quechua.
              </Text>
            </View>
          ) : (
            <View style={styles.encouragementCard}>
              <Ionicons name="book" size={40} color={COLORS.primary} />
              <Text style={styles.encouragementTitle}>
                ¡Buen intento!
              </Text>
              <Text style={styles.encouragementText}>
                Sigue practicando para mejorar tu comprensión en quechua. Inténtalo de nuevo con este libro o prueba otro.
              </Text>
            </View>
          )}
          
          <Button 
            title="Finalizar" 
            onPress={handleFinish}
            icon={<Ionicons name="checkmark-circle-outline" size={22} color="white" />}
            style={{ marginTop: 30 }}
          />
        </ScrollView>
      </View>
    );
  }
  
  const question = quiz.questions[currentQuestion];
  
  return (
    <View style={globalStyles.container}>
      <LinearGradient
        colors={COLORS.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Header 
          title="Quiz" 
          showBack={true} 
          onBackPress={() => navigation.goBack()} 
        />
      </LinearGradient>
      
      <View style={styles.progressIndicator}>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }
              ]} 
            />
          </View>
        </View>
        <View style={styles.progressTextContainer}>
          <Text style={styles.progressText}>
            Pregunta {currentQuestion + 1} de {quiz.questions.length}
          </Text>
          <View style={styles.questionNumberBox}>
            <Text style={styles.questionNumber}>{currentQuestion + 1}</Text>
          </View>
        </View>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.questionCard}>
          <Text style={styles.question}>{question.text}</Text>
        </View>
        
        <View style={styles.answersList}>
          {question.answers.map((answer, index) => (
            <TouchableOpacity
            key={index}
            style={[
              styles.answerOption,
              selectedAnswers[currentQuestion] === index && styles.selectedAnswer
            ]}
            onPress={() => handleSelectAnswer(currentQuestion, index)}
          >
            <View style={styles.answerContent}>
              <View style={[
                styles.answerCheck, 
                selectedAnswers[currentQuestion] === index && styles.answerCheckSelected
              ]}>
                {selectedAnswers[currentQuestion] === index && (
                  <Ionicons name="checkmark" size={20} color="white" />
                )}
              </View>
              <Text style={styles.answerText}>{answer}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
    
    <View style={styles.buttonContainer}>
      <Button 
        title={currentQuestion < quiz.questions.length - 1 ? "Siguiente" : "Ver Resultados"} 
        onPress={handleNextQuestion}
        disabled={selectedAnswers[currentQuestion] === undefined}
        style={selectedAnswers[currentQuestion] === undefined ? styles.disabledButton : {}}
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
progressIndicator: {
  padding: 20,
  borderBottomWidth: 1,
  borderBottomColor: COLORS.border,
  backgroundColor: COLORS.card,
},
progressBarContainer: {
  marginBottom: 10,
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
progressTextContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
progressText: {
  fontSize: 14,
  color: COLORS.textLight,
},
questionNumberBox: {
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: COLORS.primary,
  justifyContent: 'center',
  alignItems: 'center',
},
questionNumber: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 14,
},
content: {
  flex: 1,
},
questionCard: {
  backgroundColor: COLORS.card,
  padding: 20,
  margin: 20,
  marginBottom: 10,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: COLORS.border,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
  elevation: 2,
},
question: {
  fontSize: 18,
  fontWeight: 'bold',
  color: COLORS.text,
  lineHeight: 26,
},
answersList: {
  paddingHorizontal: 20,
},
answerOption: {
  backgroundColor: COLORS.card,
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: COLORS.border,
},
answerContent: {
  flexDirection: 'row',
  alignItems: 'center',
},
answerCheck: {
  width: 28,
  height: 28,
  borderRadius: 14,
  borderWidth: 2,
  borderColor: COLORS.border,
  marginRight: 12,
  justifyContent: 'center',
  alignItems: 'center',
},
answerCheckSelected: {
  backgroundColor: COLORS.primary,
  borderColor: COLORS.primary,
},
selectedAnswer: {
  backgroundColor: 'rgba(74, 111, 255, 0.1)',
  borderColor: COLORS.primary,
},
answerText: {
  fontSize: 16,
  color: COLORS.text,
  flex: 1,
  lineHeight: 22,
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
resultsContainer: {
  padding: 20,
},
scoreCard: {
  backgroundColor: COLORS.card,
  borderRadius: 16,
  padding: 20,
  marginBottom: 20,
  borderWidth: 1,
  borderColor: COLORS.border,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
  elevation: 2,
},
scoreTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: COLORS.text,
  marginBottom: 10,
  textAlign: 'center',
},
scoreValue: {
  fontSize: 64,
  fontWeight: 'bold',
  color: COLORS.primary,
  textAlign: 'center',
  marginBottom: 20,
},
statsSection: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  borderTopWidth: 1,
  borderTopColor: COLORS.border,
  paddingTop: 20,
},
statItem: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
},
statIconContainer: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: 'rgba(72, 187, 120, 0.1)',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 10,
},
statText: {
  
},
statValue: {
  fontSize: 18,
  fontWeight: 'bold',
  color: COLORS.success,
},
statLabel: {
  fontSize: 12,
  color: COLORS.textLight,
},
statSeparator: {
  width: 1,
  height: '80%',
  backgroundColor: COLORS.border,
  marginHorizontal: 10,
},
medalContainer: {
  backgroundColor: 'rgba(246, 173, 85, 0.1)',
  borderRadius: 16,
  padding: 25,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: COLORS.warning,
  marginBottom: 20,
},
medalIconBackground: {
  width: 80,
  height: 80,
  borderRadius: 40,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 15,
},
medalIcon: {
  
},
medalText: {
  fontSize: 16,
  color: COLORS.text,
  marginBottom: 10,
  textAlign: 'center',
  fontWeight: 'bold',
},
medalTitle: {
  fontSize: 22,
  fontWeight: 'bold',
  color: COLORS.warning,
  textAlign: 'center',
  marginBottom: 10,
},
medalDescription: {
  fontSize: 14,
  color: COLORS.textLight,
  textAlign: 'center',
  lineHeight: 20,
},
encouragementCard: {
  backgroundColor: COLORS.card,
  borderRadius: 16,
  padding: 25,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: COLORS.border,
  marginBottom: 20,
},
encouragementTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  color: COLORS.text,
  marginTop: 15,
  marginBottom: 10,
},
encouragementText: {
  fontSize: 14,
  color: COLORS.textLight,
  textAlign: 'center',
  lineHeight: 22,
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

export default BookQuizScreen;
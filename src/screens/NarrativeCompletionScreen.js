// src/screens/NarrativeCompletionScreen.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import Header from '../components/Header';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, globalStyles } from '../styles/globalStyles';
import { LinearGradient } from 'expo-linear-gradient';

const NarrativeCompletionScreen = ({ route, navigation }) => {
  const { narrativeTitle } = route.params;
  
  return (
    <SafeAreaView style={globalStyles.container}>
      <LinearGradient
        colors={COLORS.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Header 
          title="¡Historia Completada!" 
          showBack={false}
        />
      </LinearGradient>
      
      <View style={styles.content}>
        <View style={styles.successIconContainer}>
          <LinearGradient
            colors={['#5B86E5', '#7C5CEF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconCircle}
          >
            <Ionicons name="checkmark" size={60} color="white" />
          </LinearGradient>
        </View>
        
        <Text style={styles.completedTitle}>¡Felicitaciones!</Text>
        <Text style={styles.completedText}>
          Has completado la narrativa interactiva:
        </Text>
        <Text style={styles.narrativeTitle}>{narrativeTitle}</Text>
        
        <View style={styles.medalContainer}>
          <LinearGradient
            colors={['#FFA500', '#FFD700']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.medalCircle}
          >
            <Ionicons name="trophy" size={60} color="white" style={styles.medalIcon} />
          </LinearGradient>
          <Text style={styles.medalText}>¡Has ganado una medalla!</Text>
          <Text style={styles.medalTitle}>Narrador de Historias</Text>
          <Text style={styles.medalDescription}>
            Has completado con éxito una historia interactiva, tomando tus propias decisiones y descubriendo sus consecuencias.
          </Text>
        </View>
        
        <Button 
          title="Volver a las Narrativas" 
          onPress={() => navigation.navigate('InteractiveNarratives')}
          icon={<Ionicons name="bookmarks" size={22} color="white" />}
          style={{ marginTop: 30 }}
        />
        
        <Button 
          title="Ir al Menú Principal" 
          onPress={() => navigation.navigate('MainTabs')}
          gradient={false}
          outline={true}
          icon={<Ionicons name="home" size={22} color={COLORS.primary} />}
          style={styles.menuButton}
        />
      </View>
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
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  completedText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 6,
  },
  narrativeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 30,
    textAlign: 'center',
  },
  medalContainer: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.5)',
  },
  medalCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  medalIcon: {
    
  },
  medalText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
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
    lineHeight: 22,
  },
  menuButton: {
    marginTop: 16,
  },
});

export default NarrativeCompletionScreen;
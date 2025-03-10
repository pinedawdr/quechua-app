// src/screens/NarrativeCompletionScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Header from '../components/Header';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, globalStyles } from '../styles/globalStyles';

const NarrativeCompletionScreen = ({ route, navigation }) => {
  const { narrativeTitle } = route.params;
  
  return (
    <View style={globalStyles.container}>
      <Header 
        title="¡Historia Completada!" 
        showBack={false}
      />
      
      <View style={styles.content}>
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
        </View>
        
        <Text style={styles.completedTitle}>¡Felicitaciones!</Text>
        <Text style={styles.completedText}>
          Has completado la narrativa interactiva:
        </Text>
        <Text style={styles.narrativeTitle}>{narrativeTitle}</Text>
        
        <View style={styles.medalContainer}>
          <Ionicons name="trophy" size={60} color={COLORS.accent} style={styles.medalIcon} />
          <Text style={styles.medalText}>¡Has ganado una medalla!</Text>
          <Text style={styles.medalTitle}>Narrador de Historias</Text>
        </View>
        
        <Button 
          title="Volver a las Narrativas" 
          onPress={() => navigation.navigate('InteractiveNarratives')}
          icon={<Ionicons name="bookmarks-outline" size={22} color="white" />}
          style={{ marginTop: 30 }}
        />
        
        <Button 
          title="Ir al Menú Principal" 
          onPress={() => navigation.navigate('MainTabs')}
          gradient={false}
          outline={true}
          icon={<Ionicons name="home-outline" size={22} color={COLORS.primary} />}
          style={styles.menuButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconContainer: {
    marginBottom: 20,
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
    marginBottom: 5,
  },
  narrativeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 30,
    textAlign: 'center',
  },
  medalContainer: {
    backgroundColor: 'rgba(94, 96, 206, 0.1)',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  medalIcon: {
    marginBottom: 15,
  },
  medalText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 5,
    textAlign: 'center',
  },
  medalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.accent,
    textAlign: 'center',
  },
  menuButton: {
    marginTop: 15,
  },
});

export default NarrativeCompletionScreen;
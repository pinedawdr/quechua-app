// src/screens/WelcomeScreen.js
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TextInput, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import useAuthStore from '../store/authStore';
import { COLORS, globalStyles } from '../styles/globalStyles';

const WelcomeScreen = ({ navigation }) => {
  const [guestName, setGuestName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showGuestInput, setShowGuestInput] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const setGuestUser = useAuthStore(state => state.setGuestUser);
  const setUser = useAuthStore(state => state.setUser);

  const handleGuestAccess = () => {
    if (showGuestInput) {
      if (guestName.trim()) {
        setGuestUser(guestName);
        // El store cambiará el estado y la navegación se actualizará automáticamente
      }
    } else {
      setShowGuestInput(true);
    }
  };

  const handleLoginWithEmail = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa tu correo y contraseña');
      return;
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      // El store cambiará el estado y la navegación se actualizará automáticamente
    } catch (error) {
      console.error('Error de inicio de sesión:', error);
      Alert.alert('Error', 'No se pudo iniciar sesión. Revisa tus credenciales.');
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <LinearGradient
      colors={COLORS.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/logotype.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <Text style={styles.title}>Bienvenidos</Text>
        <Text style={styles.subtitle}>Aprende quechua de manera divertida e interactiva</Text>
        
        {showGuestInput ? (
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={22} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu nombre"
              value={guestName}
              onChangeText={setGuestName}
              placeholderTextColor={COLORS.textLight}
            />
          </View>
        ) : null}
        
        {showLoginForm ? (
          <>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={22} color={COLORS.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                placeholderTextColor={COLORS.textLight}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={22} color={COLORS.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                placeholderTextColor={COLORS.textLight}
                secureTextEntry
              />
            </View>
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleLoginWithEmail}
              activeOpacity={0.8}
            >
              <Ionicons name="log-in-outline" size={20} color="white" style={{marginRight: 8}} />
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            </TouchableOpacity>
            <Text 
              style={styles.switchText}
              onPress={() => setShowLoginForm(false)}
            >
              Volver
            </Text>
          </>
        ) : (
          <>
            <TouchableOpacity 
              style={styles.welcomeButton}
              onPress={handleGuestAccess} 
              activeOpacity={0.8}
            >
              <Ionicons name="person" size={20} color="white" style={{marginRight: 8}} />
              <Text style={styles.welcomeButtonText}>
                {showGuestInput ? "Continuar como Invitado" : "Acceder como Invitado"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.welcomeButton}
              onPress={() => setShowLoginForm(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="mail" size={20} color="white" style={{marginRight: 8}} />
              <Text style={styles.welcomeButtonText}>Iniciar Sesión con Email</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.registerButton}
              onPress={handleRegister}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={20} color={COLORS.primary} style={{marginRight: 8}} />
              <Text style={styles.registerButtonText}>Registrarse</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  logoContainer: {
    width: 200,
    height: 200,
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginBottom: 40,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    width: '100%',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    color: COLORS.text,
  },
  welcomeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  switchText: {
    color: 'white',
    marginTop: 20,
    fontSize: 16,
    textDecorationLine: 'underline',
  }
});

export default WelcomeScreen;
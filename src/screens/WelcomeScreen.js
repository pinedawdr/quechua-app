// src/screens/WelcomeScreen.js
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TextInput, Alert, TouchableOpacity, SafeAreaView } from 'react-native';
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
      } else {
        Alert.alert('Nombre requerido', 'Por favor ingresa tu nombre para continuar');
      }
    } else {
      setShowGuestInput(true);
    }
  };

  const handleLoginWithEmail = async () => {
    if (!email || !password) {
      Alert.alert('Campos incompletos', 'Por favor ingresa tu correo y contraseña');
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
    <SafeAreaView style={styles.safeArea}>
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
          
          <Text style={styles.title}>¡Allin p'unchay!</Text>
          <Text style={styles.subtitle}>Aprende quechua de manera divertida e interactiva</Text>
          
          <View style={styles.actionContainer}>
            {showGuestInput ? (
              <View style={styles.inputContainer}>
                <Ionicons name="happy-outline" size={24} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ingresa tu nombre"
                  value={guestName}
                  onChangeText={setGuestName}
                  placeholderTextColor={COLORS.textLight}
                  maxLength={15}
                />
              </View>
            ) : null}
            
            {showLoginForm ? (
              <>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={24} color={COLORS.primary} style={styles.inputIcon} />
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
                  <Ionicons name="lock-closed-outline" size={24} color={COLORS.primary} style={styles.inputIcon} />
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
                  <Ionicons name="log-in-outline" size={22} color="white" style={{marginRight: 10}} />
                  <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                </TouchableOpacity>
                <Text 
                  style={styles.switchText}
                  onPress={() => setShowLoginForm(false)}
                >
                  Volver a opciones
                </Text>
              </>
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.welcomeButton}
                  onPress={handleGuestAccess} 
                  activeOpacity={0.8}
                >
                  <Ionicons name="person" size={22} color="white" style={{marginRight: 10}} />
                  <Text style={styles.welcomeButtonText}>
                    {showGuestInput ? "Continuar como Invitado" : "Acceder como Invitado"}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.welcomeButton, styles.loginBtn]}
                  onPress={() => setShowLoginForm(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="mail" size={22} color="white" style={{marginRight: 10}} />
                  <Text style={styles.welcomeButtonText}>Iniciar Sesión con Email</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.registerButton}
                  onPress={handleRegister}
                  activeOpacity={0.8}
                >
                  <Ionicons name="create-outline" size={22} color={COLORS.primary} style={{marginRight: 10}} />
                  <Text style={styles.registerButtonText}>Registrarme</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          
          <View style={styles.decoration}>
            <Ionicons name="chatbubbles-outline" size={30} color="rgba(255,255,255,0.3)" />
            <Ionicons name="book-outline" size={30} color="rgba(255,255,255,0.3)" style={{marginLeft: 20}} />
            <Ionicons name="school-outline" size={30} color="rgba(255,255,255,0.3)" style={{marginLeft: 20}} />
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
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
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: 'hidden',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  logo: {
    width: '80%',
    height: '80%',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginBottom: 40,
    textAlign: 'center',
  },
  actionContainer: {
    width: '100%',
    maxWidth: 350,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    width: '100%',
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    color: COLORS.text,
    fontSize: 16,
  },
  welcomeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    width: '100%',
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  loginBtn: {
    backgroundColor: 'rgba(124, 92, 239, 0.4)',
  },
  welcomeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    width: '100%',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  registerButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    width: '100%',
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  switchText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  decoration: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 30,
    justifyContent: 'center',
  }
});

export default WelcomeScreen;
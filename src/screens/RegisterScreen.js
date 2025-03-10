// src/screens/RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, SafeAreaView } from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import Button from '../components/Button';
import Header from '../components/Header';
import useAuthStore from '../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, globalStyles } from '../styles/globalStyles';
import { LinearGradient } from 'expo-linear-gradient';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [institution, setInstitution] = useState('');
  const [loading, setLoading] = useState(false);
  
  const setUser = useAuthStore(state => state.setUser);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Campos incompletos', 'Por favor completa los campos obligatorios');
      return;
    }
    
    // Validación de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Correo inválido', 'Por favor ingresa un correo electrónico válido');
      return;
    }
    
    // Validación de contraseña
    if (password.length < 6) {
      Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    try {
      setLoading(true);
      
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Actualizar el perfil con el nombre del usuario
      await updateProfile(user, {
        displayName: `${name} ${lastName}`.trim()
      });
      
      // Guardar información adicional en Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name,
        lastName,
        email,
        institution,
        createdAt: new Date().toISOString(),
      });
      
      setUser(user);
      // El store cambiará el estado y la navegación se actualizará automáticamente
    } catch (error) {
      console.error('Error de registro:', error);
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Error', 'Este correo electrónico ya está en uso. Intenta iniciar sesión.');
      } else {
        Alert.alert('Error', 'No se pudo completar el registro. Inténtalo de nuevo más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <LinearGradient
        colors={COLORS.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Header 
          title="Crear cuenta" 
          showBack={true} 
          onBackPress={() => navigation.goBack()} 
        />
      </LinearGradient>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeMessage}>
          <Ionicons name="person-add" size={50} color={COLORS.primary} style={styles.welcomeIcon} />
          <Text style={styles.welcomeTitle}>¡Únete a la aventura!</Text>
          <Text style={styles.welcomeText}>
            Crea tu cuenta para guardar tu progreso y acceder a todas las lecciones de quechua.
          </Text>
        </View>
        
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre <Text style={styles.required}>*</Text></Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={22} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ingresa tu nombre"
                placeholderTextColor={COLORS.textLight}
                maxLength={20}
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Apellidos</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="people-outline" size={22} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Ingresa tus apellidos"
                placeholderTextColor={COLORS.textLight}
                maxLength={30}
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo Electrónico <Text style={styles.required}>*</Text></Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={22} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Ingresa tu correo electrónico"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={COLORS.textLight}
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña <Text style={styles.required}>*</Text></Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={22} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Crea una contraseña"
                secureTextEntry
                placeholderTextColor={COLORS.textLight}
              />
            </View>
            <Text style={styles.passwordHint}>Usa al menos 6 caracteres</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Institución Educativa</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="school-outline" size={22} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                value={institution}
                onChangeText={setInstitution}
                placeholder="Ingresa tu institución educativa"
                placeholderTextColor={COLORS.textLight}
              />
            </View>
          </View>
          
          <Text style={styles.note}>* Campos obligatorios</Text>
        </View>
        
        <Button 
          title="Crear mi cuenta" 
          onPress={handleRegister}
          disabled={loading}
          style={styles.registerButton}
          icon={<Ionicons name="checkmark-circle-outline" size={22} color="white" />}
        />
        
        <Text style={styles.loginPrompt}>
          ¿Ya tienes una cuenta? <Text style={styles.loginLink} onPress={() => navigation.goBack()}>Inicia sesión</Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeMessage: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeIcon: {
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: COLORS.text,
  },
  required: {
    color: COLORS.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 16,
  },
  passwordHint: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
    marginLeft: 4,
  },
  note: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
  },
  registerButton: {
    marginTop: 10,
    marginBottom: 20,
  },
  loginPrompt: {
    textAlign: 'center',
    color: COLORS.textLight,
    marginBottom: 30,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: 'bold',
  }
});

export default RegisterScreen;
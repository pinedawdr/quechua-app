// src/screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView, TouchableOpacity, Switch, Image, ActivityIndicator, SafeAreaView } from 'react-native';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import Header from '../components/Header';
import Button from '../components/Button';
import useAuthStore from '../store/authStore';
import useProgressStore from '../store/progressStore';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, globalStyles } from '../styles/globalStyles';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../services/cloudinary';

const ProfileScreen = ({ navigation }) => {
  const { user, isGuest, guestName, logout, setUser } = useAuthStore();
  const { readingProgress, exerciseProgress, verbalFluencyProgress, medals, clearProgress } = useProgressStore();
  
  const [name, setName] = useState(user?.displayName?.split(' ')[0] || guestName);
  const [lastName, setLastName] = useState(user?.displayName?.split(' ').slice(1).join(' ') || '');
  const [institution, setInstitution] = useState('');
  const [level, setLevel] = useState('Principiante');
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userMedals, setUserMedals] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [profileStats, setProfileStats] = useState({
    booksRead: 0,
    exercisesCompleted: 0,
    totalMinutes: 0
  });
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Cargar datos de perfil adicionales al iniciar
  useEffect(() => {
    const loadProfileData = async () => {
      if (!isGuest && user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setInstitution(userData.institution || '');
            setLevel(userData.level || 'Principiante');
            setNotifications(userData.notifications !== undefined ? userData.notifications : true);
            // Cargar la foto de perfil si existe
            if (userData.profileImage) {
              setProfileImage(userData.profileImage);
            }
          }
          
          // Contar actividades de lectura completadas
          const readingQuery = collection(db, 'users', user.uid, 'reading');
          const readingSnapshot = await getDocs(readingQuery);
          const readingCount = readingSnapshot.size;
          
          // Contar quizzes completados
          const quizzesQuery = collection(db, 'users', user.uid, 'quizzes');
          const quizzesSnapshot = await getDocs(quizzesQuery);
          const quizzesCount = quizzesSnapshot.size;
          
          // Contar ejercicios verbales completados
          const verbalQuery = collection(db, 'users', user.uid, 'verbalExercises');
          const verbalSnapshot = await getDocs(verbalQuery);
          const verbalCount = verbalSnapshot.size;
          
          // Actualizar estadísticas
          const totalCompleted = readingCount + quizzesCount + verbalCount;
          const estimatedMinutes = totalCompleted * 5; // Estimación básica de minutos
          
          setProfileStats({
            booksRead: readingCount,
            exercisesCompleted: quizzesCount + verbalCount,
            totalMinutes: estimatedMinutes
          });
          
          // Actualizar en Firestore
          await setDoc(doc(db, 'users', user.uid, 'stats', 'overview'), {
            booksRead: readingCount,
            exercisesCompleted: quizzesCount + verbalCount,
            totalMinutes: estimatedMinutes,
            updatedAt: new Date().toISOString()
          }, { merge: true });
          
          // Cargar medallas del usuario
          const medalsQuery = await getDoc(doc(db, 'users', user.uid, 'stats', 'medals'));
          if (medalsQuery.exists()) {
            const medalCount = medalsQuery.data().count || medals.length;
            setUserMedals(medalCount);
            setUserLevel(calculateUserLevel(medalCount));
          } else {
            // Si no hay documento de medallas, usar las medallas locales
            setUserMedals(medals.length);
            setUserLevel(calculateUserLevel(medals.length));
            
            // Guardar conteo de medallas en Firestore
            await setDoc(doc(db, 'users', user.uid, 'stats', 'medals'), {
              count: medals.length,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }
        } catch (error) {
          console.error('Error loading profile data:', error);
        }
      } else {
        // Para modo invitado, usar datos locales
        const readingCount = Object.keys(readingProgress).length;
        const exerciseCount = Object.keys(exerciseProgress).length;
        const verbalCount = Object.keys(verbalFluencyProgress).length;
        const totalCompleted = readingCount + exerciseCount + verbalCount;
        
        setProfileStats({
          booksRead: readingCount,
          exercisesCompleted: exerciseCount + verbalCount,
          totalMinutes: totalCompleted * 5 // Estimación básica de minutos
        });
        
        setUserMedals(medals.length);
        setUserLevel(calculateUserLevel(medals.length));
      }
    };
    
    loadProfileData();
  }, [user, isGuest, readingProgress, exerciseProgress, verbalFluencyProgress, medals]);
  
  // Calcular nivel de usuario basado en medallas
  const calculateUserLevel = (medals) => {
    if (medals >= 20) return 5; // Experto
    if (medals >= 15) return 4; // Avanzado
    if (medals >= 10) return 3; // Intermedio
    if (medals >= 5) return 2;  // Básico
    return 1; // Principiante
  };
  
  // Obtener etiqueta de nivel
  const getLevelLabel = (level) => {
    switch(level) {
      case 5: return 'Experto';
      case 4: return 'Avanzado';
      case 3: return 'Intermedio';
      case 2: return 'Básico';
      default: return 'Principiante';
    }
  };
  
  // Función para seleccionar una imagen de la galería
  const selectImage = async () => {
    if (isGuest) {
      Alert.alert(
        "Modo invitado",
        "Para cambiar tu foto de perfil, necesitas crear una cuenta. ¿Deseas registrarte?",
        [
          {
            text: "Cancelar",
            style: "cancel"
          },
          {
            text: "Ir a registro",
            onPress: () => navigation.navigate('Register')
          }
        ]
      );
      return;
    }
    
    // Solicitar permisos para acceder a la galería
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para seleccionar una foto de perfil.');
      return;
    }
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setUploadingImage(true);
        
        try {
          // Subir la imagen a Cloudinary
          const imageUrl = await uploadImage(imageUri);
          
          // Actualizar el estado local
          setProfileImage(imageUrl);
          
          // Guardar en Firestore
          if (user) {
            await setDoc(doc(db, 'users', user.uid), {
              profileImage: imageUrl,
              updatedAt: new Date().toISOString()
            }, { merge: true });
            
            Alert.alert('Éxito', 'Foto de perfil actualizada correctamente');
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          Alert.alert('Error', 'No se pudo subir la imagen. Intenta nuevamente.');
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen. Intenta nuevamente.');
      setUploadingImage(false);
    }
  };
  
  // Función para tomar una foto con la cámara
  const takePhoto = async () => {
    if (isGuest) {
      Alert.alert(
        "Modo invitado",
        "Para cambiar tu foto de perfil, necesitas crear una cuenta. ¿Deseas registrarte?",
        [
          {
            text: "Cancelar",
            style: "cancel"
          },
          {
            text: "Ir a registro",
            onPress: () => navigation.navigate('Register')
          }
        ]
      );
      return;
    }
    
    // Solicitar permisos para acceder a la cámara
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara para tomar una foto.');
      return;
    }
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setUploadingImage(true);
        
        try {
          // Subir la imagen a Cloudinary
          const imageUrl = await uploadImage(imageUri);
          
          // Actualizar el estado local
          setProfileImage(imageUrl);
          
          // Guardar en Firestore
          if (user) {
            await setDoc(doc(db, 'users', user.uid), {
              profileImage: imageUrl,
              updatedAt: new Date().toISOString()
            }, { merge: true });
            
            Alert.alert('Éxito', 'Foto de perfil actualizada correctamente');
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          Alert.alert('Error', 'No se pudo subir la imagen. Intenta nuevamente.');
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'No se pudo tomar la foto. Intenta nuevamente.');
      setUploadingImage(false);
    }
  };
  
  // Función para mostrar opciones de imagen
  const showImageOptions = () => {
    if (isGuest) {
      Alert.alert(
        "Modo invitado",
        "Para cambiar tu foto de perfil, necesitas crear una cuenta. ¿Deseas registrarte?",
        [
          {
            text: "Cancelar",
            style: "cancel"
          },
          {
            text: "Ir a registro",
            onPress: () => navigation.navigate('Register')
          }
        ]
      );
      return;
    }
    
    Alert.alert(
      "Cambiar foto de perfil",
      "Selecciona una opción",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Tomar foto",
          onPress: takePhoto
        },
        {
          text: "Elegir de la galería",
          onPress: selectImage
        }
      ]
    );
  };
  
  const handleSaveChanges = async () => {
    if (isGuest) {
      Alert.alert(
        "Modo invitado",
        "Para guardar tu perfil, necesitas crear una cuenta. ¿Deseas registrarte?",
        [
          {
            text: "Cancelar",
            style: "cancel"
          },
          {
            text: "Ir a registro",
            onPress: () => navigation.navigate('Register')
          }
        ]
      );
      return;
    }
    
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    
    try {
      setSaving(true);
      
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: `${name} ${lastName}`.trim()
      });
      
      // Update Firestore user document
      await setDoc(doc(db, 'users', user.uid), {
        name,
        lastName,
        institution,
        level,
        notifications,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      // Guardar preferencias
      await setDoc(doc(db, 'users', user.uid, 'preferences', 'app'), {
        notifications,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      // Update local state
      setUser({ ...user, displayName: `${name} ${lastName}`.trim() });
      
      Alert.alert('Éxito', 'Tu perfil ha sido actualizado');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro que deseas cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Cerrar sesión",
          onPress: () => {
            logout();
            clearProgress(); // Limpiar progreso local al cerrar sesión
            // El store cambiará el estado y la navegación se actualizará automáticamente
          }
        }
      ]
    );
  };
  
  const handleResetProgress = () => {
    Alert.alert(
      "Restablecer progreso",
      "¿Estás seguro de que deseas restablecer todo tu progreso? Esta acción no se puede deshacer.",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Restablecer",
          style: "destructive",
          onPress: async () => {
            try {
              clearProgress(); // Limpiar progreso local
              
              if (!isGuest && user) {
                // Marcar como "reset" en Firestore para mantener historial
                await setDoc(doc(db, 'users', user.uid, 'stats', 'reset'), {
                  resetAt: new Date().toISOString(),
                  previousStats: profileStats
                }, { merge: true });
                
                // Actualizar estadísticas
                await setDoc(doc(db, 'users', user.uid, 'stats', 'overview'), {
                  booksRead: 0,
                  exercisesCompleted: 0,
                  totalMinutes: 0,
                  resetAt: new Date().toISOString()
                }, { merge: true });
                
                // Actualizar conteo de medallas
                await setDoc(doc(db, 'users', user.uid, 'stats', 'medals'), {
                  count: 0,
                  resetAt: new Date().toISOString()
                }, { merge: true });
                
                // Actualizar stats locales
                setProfileStats({
                  booksRead: 0,
                  exercisesCompleted: 0,
                  totalMinutes: 0
                });
                
                setUserMedals(0);
                setUserLevel(1);
              }
              
              Alert.alert('Éxito', 'Tu progreso ha sido restablecido');
            } catch (error) {
              console.error('Error resetting progress:', error);
              Alert.alert('Error', 'No se pudo restablecer el progreso. Intenta nuevamente.');
            }
          }
        }
      ]
    );
  };
  
  const renderUserLevel = () => {
    return (
      <View style={styles.levelContainer}>
        <View style={styles.levelHeader}>
          <Text style={styles.levelTitle}>Nivel de Aprendizaje</Text>
          <Text style={styles.levelValue}>{getLevelLabel(userLevel)}</Text>
        </View>
        
        <View style={styles.levelBarContainer}>
          <View style={styles.levelBar}>
            <View 
              style={[
                styles.levelBarFill, 
                { width: `${(userLevel / 5) * 100}%` }
              ]} 
            />
          </View>
          <View style={styles.levelMarkers}>
            <Text style={styles.levelMarker}>1</Text>
            <Text style={styles.levelMarker}>2</Text>
            <Text style={styles.levelMarker}>3</Text>
            <Text style={styles.levelMarker}>4</Text>
            <Text style={styles.levelMarker}>5</Text>
          </View>
        </View>
        <Text style={styles.levelDescription}>
          Has ganado {userMedals} medallas. Completa más actividades para subir de nivel.
        </Text>
      </View>
    );
  };
  
  const renderUserStats = () => {
    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsHeader}>
          <Text style={styles.statsSectionTitle}>Mis estadísticas</Text>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, {backgroundColor: 'rgba(91, 134, 229, 0.15)'}]}>
              <Ionicons name="book" size={20} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.statValue}>{profileStats.booksRead}</Text>
              <Text style={styles.statLabel}>Libros</Text>
            </View>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, {backgroundColor: 'rgba(124, 92, 239, 0.15)'}]}>
              <Ionicons name="checkmark-done" size={20} color={COLORS.accent} />
            </View>
            <View>
              <Text style={[styles.statValue, {color: COLORS.accent}]}>{profileStats.exercisesCompleted}</Text>
              <Text style={styles.statLabel}>Ejercicios</Text>
            </View>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, {backgroundColor: 'rgba(255, 152, 0, 0.15)'}]}>
              <Ionicons name="time" size={20} color={COLORS.warning} />
            </View>
            <View>
              <Text style={[styles.statValue, {color: COLORS.warning}]}>{profileStats.totalMinutes}</Text>
              <Text style={styles.statLabel}>Minutos</Text>
            </View>
          </View>
        </View>
      </View>
    );
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
          title="Perfil" 
          showBack={false}
        />
      </LinearGradient>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentInner}>
          <View style={styles.profileHeader}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={showImageOptions}
              activeOpacity={0.9}
              disabled={uploadingImage}
            >
              {profileImage ? (
                <Image 
                  source={{ uri: profileImage }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarLetter}>
                  {(isGuest ? guestName : name).charAt(0).toUpperCase()}
                </Text>
              )}
              
              {!isGuest && (
                <View style={styles.editAvatarButton}>
                  {uploadingImage ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="camera" size={16} color="white" />
                  )}
                </View>
              )}
            </TouchableOpacity>
            
            <Text style={styles.profileName}>
              {isGuest ? guestName : (user?.displayName || 'Usuario')}
            </Text>
            <View style={[
              styles.profileBadge, 
              isGuest ? styles.guestBadge : styles.userBadge
            ]}>
              <Text style={styles.profileBadgeText}>
                {isGuest ? "Invitado" : getLevelLabel(userLevel)}
              </Text>
            </View>
          </View>
          
          {!isGuest && (
            <>
              {renderUserLevel()}
              {renderUserStats()}
            </>
          )}
          
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            
            <Text style={styles.label}>Nombre <Text style={styles.required}>*</Text></Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person" size={20} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ingresa tu nombre"
                placeholderTextColor={COLORS.textLight}
              />
            </View>
            
            <Text style={styles.label}>Apellidos</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="people" size={20} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput 
                style={[styles.input, !isGuest ? null : styles.disabledInput]}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Ingresa tus apellidos"
                placeholderTextColor={COLORS.textLight}
                editable={!isGuest}
              />
            </View>
            
            {!isGuest && (
              <>
                <Text style={styles.label}>Correo Electrónico</Text>
                <View style={[styles.inputWrapper, styles.disabledInputWrapper]}>
                  <Ionicons name="mail" size={20} color={COLORS.textLight} style={styles.inputIcon} />
                  <TextInput 
                    style={[styles.input, styles.disabledInput]}
                    value={user?.email || ''}
                    editable={false}
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
              </>
            )}
            
            <Text style={styles.label}>Institución Educativa</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="school" size={20} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput 
                style={[styles.input, !isGuest ? null : styles.disabledInput]}
                value={institution}
                onChangeText={setInstitution}
                placeholder="Ingresa tu institución educativa"
                placeholderTextColor={COLORS.textLight}
                editable={!isGuest}
              />
            </View>
            
            {isGuest && (
              <Text style={styles.guestNote}>
                * En modo invitado solo puedes cambiar tu nombre. Para editar todo tu perfil, crea una cuenta.
              </Text>
            )}
          </View>
          
          {!isGuest && (
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Preferencias</Text>
              
              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Ionicons name="notifications" size={22} color={COLORS.primary} style={styles.preferenceIcon} />
                  <View>
                    <Text style={styles.preferenceTitle}>Notificaciones</Text>
                    <Text style={styles.preferenceDescription}>Recibir notificaciones de la app</Text>
                  </View>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
                  thumbColor="white"
                />
              </View>
            </View>
          )}
          
          <Button 
            title="Guardar Cambios" 
            onPress={handleSaveChanges}
            disabled={saving}
            style={{ marginBottom: 20 }}
            icon={<Ionicons name="save" size={22} color="white" />}
          />
          
          {!isGuest && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.dangerButton]}
              onPress={handleResetProgress}
            >
              <Ionicons name="refresh" size={22} color={COLORS.error} />
              <Text style={styles.dangerButtonText}>Restablecer Progreso</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={22} color={COLORS.textLight} />
            <Text style={styles.actionButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
          
          <View style={styles.footer}>
            <Text style={styles.versionText}>Versión 1.0.0</Text>
          </View>
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
    backgroundColor: COLORS.background,
  },
  contentInner: {
    padding: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    borderWidth: 4,
    borderColor: 'white',
  },
  avatarLetter: {
    fontSize: 50,
    fontWeight: 'bold',
    color: 'white',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.accent,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  profileBadge: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 5,
  },
  guestBadge: {
    backgroundColor: COLORS.warning,
  },
  userBadge: {
    backgroundColor: COLORS.primary,
  },
  profileBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  levelContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  levelValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  levelBarContainer: {
    marginBottom: 16,
  },
  levelBar: {
    height: 10,
    backgroundColor: '#F0F0F5',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  levelBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  levelMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelMarker: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  levelDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statsHeader: {
    marginBottom: 16,
  },
  statsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 25,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  disabledInputWrapper: {
    backgroundColor: '#F0F0F5',
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
  disabledInput: {
    backgroundColor: '#F0F0F5',
    color: COLORS.textLight,
  },
  guestNote: {
    fontSize: 14,
    color: COLORS.error,
    marginTop: 5,
    marginBottom: 10,
    lineHeight: 20,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  preferenceIcon: {
    marginRight: 12,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 3,
  },
  preferenceDescription: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  actionButtonText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginLeft: 10,
  },
  dangerButton: {
    borderColor: 'rgba(244, 67, 54, 0.2)',
    backgroundColor: 'rgba(244, 67, 54, 0.05)',
  },
  dangerButtonText: {
    fontSize: 16,
    color: COLORS.error,
    marginLeft: 10,
  },
  footer: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 30,
  },
  versionText: {
    fontSize: 12,
    color: COLORS.textLight,
  }
});

export default ProfileScreen;
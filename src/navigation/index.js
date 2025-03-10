// src/navigation/index.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import useAuthStore from '../store/authStore';
import { COLORS } from '../styles/globalStyles';

// Auth Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Main Screens
import MainMenuScreen from '../screens/MainMenuScreen';
import ReadingActivitiesScreen from '../screens/ReadingActivitiesScreen';
import BookReaderScreen from '../screens/BookReaderScreen';
import BookQuizScreen from '../screens/BookQuizScreen';
import VerbalFluencyScreen from '../screens/VerbalFluencyScreen';
import VerbalExerciseScreen from '../screens/VerbalExerciseScreen';
import InteractiveNarrativesScreen from '../screens/InteractiveNarrativesScreen';
import InteractiveNarrativeScreen from '../screens/InteractiveNarrativeScreen';
import NarrativeCompletionScreen from '../screens/NarrativeCompletionScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Componente personalizado para la barra de tabs sin efecto al hacer clic
function MyTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Determinar el icono correcto
        let iconName;
        if (route.name === 'Home') {
          iconName = 'grid';
        } else if (route.name === 'Progress') {
          iconName = 'trending-up';
        } else if (route.name === 'Profile') {
          iconName = 'person-circle';
        }

        return (
          <TouchableOpacity
            key={index}
            onPress={onPress}
            style={styles.tabButton}
            activeOpacity={1}  // Esto elimina el efecto de opacidad al hacer clic
          >
            <Ionicons
              name={iconName}
              size={24}
              color={isFocused ? COLORS.primary : COLORS.textLight}
            />
            <Text style={[
              styles.tabLabel,
              { color: isFocused ? COLORS.primary : COLORS.textLight }
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const MainAppTabs = () => {
  return (
    <Tab.Navigator
      tabBar={props => <MyTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
      }}
    >
      <Tab.Screen name="Home" component={MainMenuScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="Progress" component={ProgressScreen} options={{ title: 'Progreso' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Mi Perfil' }} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, isGuest } = useAuthStore();
  
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated && !isGuest ? (
          // Auth Stack
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // Main App Stack
          <>
            <Stack.Screen name="MainTabs" component={MainAppTabs} />
            <Stack.Screen name="ReadingActivities" component={ReadingActivitiesScreen} />
            <Stack.Screen name="BookReader" component={BookReaderScreen} />
            <Stack.Screen name="BookQuiz" component={BookQuizScreen} />
            <Stack.Screen name="VerbalFluency" component={VerbalFluencyScreen} />
            <Stack.Screen name="VerbalExercise" component={VerbalExerciseScreen} />
            <Stack.Screen name="InteractiveNarratives" component={InteractiveNarrativesScreen} />
            <Stack.Screen name="InteractiveNarrative" component={InteractiveNarrativeScreen} />
            <Stack.Screen name="NarrativeCompletion" component={NarrativeCompletionScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    height: 60,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 0,  // Sin borde superior
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  }
});

export default AppNavigator;
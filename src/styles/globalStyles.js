// src/styles/globalStyles.js
import { StyleSheet } from 'react-native';

export const COLORS = {
  primary: '#4A6FFF',        // Azul principal
  secondary: '#36D1DC',      // Azul turquesa
  accent: '#5E60CE',         // Púrpura suave
  gradient: ['#4A6FFF', '#36D1DC'],  // Gradiente principal
  accentGradient: ['#5E60CE', '#4A6FFF'],  // Gradiente secundario
  background: '#F8FAFF',     // Fondo claro
  text: '#2D3748',           // Texto oscuro
  textLight: '#718096',      // Texto secundario
  success: '#48BB78',        // Verde éxito
  error: '#F56565',          // Rojo error
  warning: '#F6AD55',        // Naranja advertencia
  card: '#FFFFFF',           // Fondo de tarjetas
  border: '#E2E8F0',         // Bordes
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 4.65,
    elevation: 2,
  }
};

export const FONTS = {
  heading: {
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subheading: {
    fontWeight: '600',
    color: COLORS.text,
  },
  body: {
    color: COLORS.text,
  },
  caption: {
    fontSize: 14,
    color: COLORS.textLight,
  }
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  paddedContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 15,
    padding: 15,
    marginVertical: 8,
    ...SHADOWS.small,
    borderWidth: 0,
  },
  title: {
    fontSize: 22,
    ...FONTS.heading,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    ...FONTS.subheading,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    ...FONTS.body,
    marginBottom: 15,
  },
  inputContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 0,
    padding: 12,
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    ...FONTS.subheading,
    marginBottom: 5,
  },
  gradientButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.card,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    marginRight: 15,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
    marginTop: 20,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 15,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginVertical: 8,
  },
  successText: {
    color: COLORS.success,
    fontSize: 14,
    marginVertical: 8,
  },
  warningText: {
    color: COLORS.warning,
    fontSize: 14,
    marginVertical: 8,
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    borderRadius: 12,
  },
  listItemText: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  }
});
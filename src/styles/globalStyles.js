// src/styles/globalStyles.js
import { StyleSheet } from 'react-native';

export const COLORS = {
  primary: '#5B86E5',        // Azul principal más vibrante
  secondary: '#36D1DC',      // Azul turquesa
  accent: '#7C5CEF',         // Púrpura más vibrante  
  gradient: ['#5B86E5', '#36D1DC'],  // Gradiente principal
  accentGradient: ['#7C5CEF', '#5B86E5'],  // Gradiente secundario
  background: '#F8FAFF',     // Fondo claro
  text: '#2D3748',           // Texto oscuro
  textLight: '#718096',      // Texto secundario
  success: '#4CAF50',        // Verde éxito
  error: '#F44336',          // Rojo error
  warning: '#FF9800',        // Naranja advertencia
  card: '#FFFFFF',           // Fondo de tarjetas
  border: '#E2E8F0',         // Bordes
};

export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
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
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    ...FONTS.heading,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    ...FONTS.subheading,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    ...FONTS.body,
    marginBottom: 16,
    lineHeight: 24,
  },
  inputContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    ...FONTS.subheading,
    marginBottom: 6,
  },
  gradientButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 10,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.card,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    marginRight: 16,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    marginTop: 24,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
  },
  badgeText: {
    color: 'white',
    fontSize: 14,
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
    height: 10,
    backgroundColor: COLORS.background,
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  avatarText: {
    color: 'white',
    fontSize: 26,
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
    padding: 24,
    width: '100%',
    maxWidth: 500,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  listItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listItemText: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  roundedButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundedButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 4,
  },
  childFriendlyContainer: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginVertical: 10,
  },
  childFriendlyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
});
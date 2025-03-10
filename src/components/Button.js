// src/components/Button.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, globalStyles } from '../styles/globalStyles';

const Button = ({ 
  title, 
  onPress, 
  style, 
  textStyle, 
  gradient = true, 
  icon, 
  disabled = false,
  outline = false,
  colors = COLORS.gradient
}) => {
  if (gradient) {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        style={[globalStyles.gradientButton, style]} 
        disabled={disabled}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={colors}
          start={[0, 0]}
          end={[1, 1]}
          style={[
            globalStyles.buttonContent,
            disabled && styles.disabledGradient
          ]}
        >
          {icon && <View style={styles.iconWrapper}>{icon}</View>}
          <Text style={[globalStyles.buttonText, textStyle]}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[
        styles.button, 
        outline && styles.outlineButton,
        disabled && styles.disabledButton,
        style
      ]} 
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={globalStyles.buttonContent}>
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <Text style={[
          globalStyles.buttonText, 
          outline && styles.outlineButtonText,
          textStyle
        ]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    marginVertical: 8,
    overflow: 'hidden',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  outlineButtonText: {
    color: COLORS.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledGradient: {
    opacity: 0.5,
  },
  iconWrapper: {
    marginRight: 8,
  }
});

export default Button;
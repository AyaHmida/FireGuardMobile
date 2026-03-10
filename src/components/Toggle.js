import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

/**
 * Toggle Component - React Native
 * Interrupteur on/off réutilisable
 */
export const Toggle = ({ value, onChange }) => {
  return (
    <TouchableOpacity
      onPress={() => onChange(!value)}
      activeOpacity={0.8}
      style={[
        styles.container,
        {
          backgroundColor: value ? Colors.fire : Colors.border,
          shadowColor: value ? Colors.fire : 'transparent',
          shadowOpacity: value ? 0.4 : 0,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 0 },
          elevation: value ? 4 : 0,
        },
      ]}
    >
      <View style={[styles.thumb, { left: value ? 22 : 3 }]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 24,
    borderRadius: 12,
    position: 'relative',
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    top: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});

export default Toggle;
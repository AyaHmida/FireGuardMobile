import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

/**
 * StatusBar Component - React Native
 * Barre d'état supérieure (temps, batterie, signal)
 * ⚠️ Note: "StatusBar" est un composant natif React Native,
 *    renommer en "AppStatusBar" si conflit d'import
 */
export const StatusBar = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const hh = time.getHours().toString().padStart(2, '0');
  const mm = time.getMinutes().toString().padStart(2, '0');

  return (
    <View style={styles.container}>
      <Text style={styles.time}>
        {hh}:{mm}
      </Text>
      <View style={styles.icons}>
        <Text>📶</Text>
        <Text>🔋</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: Colors.bg,
  },
  time: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  icons: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
});

export default StatusBar;
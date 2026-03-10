import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { Colors } from '../theme/colors';

/**
 * PulseDot Component - React Native
 * Point animé pour indiquer le statut en temps réel
 */
export const PulseDot = ({ color = Colors.fire, size = 10 }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.4],
  });

  return (
    <View style={{ width: size, height: size }}>
      {/* Halo animé */}
      <Animated.View
        style={{
          position: 'absolute',
          top: -(size * 0.4),
          left: -(size * 0.4),
          width: size * 1.8,
          height: size * 1.8,
          borderRadius: size * 0.9,
          backgroundColor: color,
          opacity: Animated.multiply(opacity, 0.3),
        }}
      />
      {/* Point central */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
};

export default PulseDot;
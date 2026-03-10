import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../theme/colors';

export const Gauge = ({
  value,
  max,
  color,
  label,
  unit,
  size = 80,
}) => {
  const pct = Math.min(value / max, 1);
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ * 0.75;
  const rotation = 135;

  return (
    <View style={styles.container}>
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: `${rotation}deg` }] }}
      >
        {/* Cercle de fond */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={Colors.border}
          strokeWidth={7}
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
          strokeLinecap="round"
        />
        {/* Cercle de progression */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
        />
      </Svg>

      <View style={[styles.labelContainer, { marginTop: -size * 0.45 }]}>
        <Text style={styles.valueText}>
          {value}
          <Text style={styles.unitText}>{unit}</Text>
        </Text>
        <Text style={styles.labelText}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  labelContainer: {
    alignItems: 'center',
    textAlign: 'center',
  },
  valueText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  unitText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  labelText: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
  },
});

export default Gauge;
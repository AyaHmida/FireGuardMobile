import React from 'react';
import Svg, {
  Path,
  Polyline,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

/**
 * SparkLine Component - React Native
 * Graphique mini pour les tendances
 * ⚠️ Nécessite: npx expo install react-native-svg
 */
export const SparkLine = ({ data, color, height = 44 }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 220;
  const h = height;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 6) - 2;
    return { x, y };
  });

  const pts = points.map((p) => `${p.x},${p.y}`).join(' ');
  const lastPt = points[points.length - 1];
  const gradientId = `grad${color.replace('#', '')}`;

  const areaPath = `M0,${h} ${points
    .map((p) => `L${p.x},${p.y}`)
    .join(' ')} L${w},${h} Z`;

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${w} ${h}`}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={areaPath} fill={`url(#${gradientId})`} />
      <Polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx={lastPt.x}
        cy={lastPt.y}
        r="4"
        fill={color}
        stroke="#FFFFFF"
        strokeWidth="2"
      />
    </Svg>
  );
};

export default SparkLine;
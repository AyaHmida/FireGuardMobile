// helpers.js
import { Colors } from '../theme/colors';

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

export const getStatusColor = (status) => {
  const colorMap = {
    danger: Colors.danger,
    warning: Colors.warn,
    normal: Colors.safe,
    info: Colors.info,
  };
  return colorMap[status] || Colors.safe;
};

export const getStatusBackground = (status) => {
  const bgMap = {
    danger: Colors.dangerDim,
    warning: Colors.warnDim,
    normal: Colors.safeDim,
    info: Colors.infoDim,
  };
  return bgMap[status] || Colors.safeDim;
};

export const getStatusLabel = (status) => {
  const labelMap = {
    danger: 'CRITIQUE',
    warning: 'ATTENTION',
    normal: 'NORMAL',
    info: 'INFO',
  };
  return labelMap[status] || 'OK';
};

// ⚠️ Nécessite une librairie d’icônes (ex: react-native-vector-icons)
export const getAlertIcon = (type) => {
  const iconMap = {
    'Fumée': 'cloud',
    'Gaz': 'gas-cylinder',
    'Température': 'thermostat',
    'Capteur': 'sensors',
  };
  return iconMap[type] || 'alert-circle';
};

export const getTemperatureColor = (temp, thresholds = { warn: 30, danger: 40 }) => {
  if (temp >= thresholds.danger) return Colors.danger;
  if (temp >= thresholds.warn) return Colors.warn;
  return Colors.safe;
};

export const getGasColor = (gas, thresholds = { warn: 100, danger: 300 }) => {
  if (gas >= thresholds.danger) return Colors.danger;
  if (gas >= thresholds.warn) return Colors.warn;
  return Colors.safe;
};

export const getSmokeColor = (smoke, thresholds = { warn: 30, danger: 60 }) => {
  if (smoke >= thresholds.danger) return Colors.danger;
  if (smoke >= thresholds.warn) return Colors.warn;
  return Colors.safe;
};

// ═══════════════════════════════════════════════════════════
// MOCK DATA - React Native
// ⚠️ Les icônes ont été changées: material icon strings → emojis
//    (React Native n'a pas de HTML, les strings d'icônes ne marchent pas)
// ═══════════════════════════════════════════════════════════

export const ZONES = [
  {
    id: 1,
    name: 'Salon',
    icon: '🛋️',        // était: 'sofa'
    status: 'normal',
    temp: 22.4,
    gas: 12,
    smoke: 3,
    sensors: 3,
    online: 3,
  },
  {
    id: 2,
    name: 'Cuisine',
    icon: '🍳',        // était: 'local-dining'
    status: 'warning',
    temp: 31.2,
    gas: 180,
    smoke: 45,
    sensors: 4,
    online: 4,
  },
  {
    id: 3,
    name: 'Chambre',
    icon: '🛏️',        // était: 'hotel'
    status: 'normal',
    temp: 20.1,
    gas: 8,
    smoke: 1,
    sensors: 2,
    online: 2,
  },
  {
    id: 4,
    name: 'Garage',
    icon: '🚗',        // était: 'directions-car'
    status: 'danger',
    temp: 48.7,
    gas: 520,
    smoke: 89,
    sensors: 3,
    online: 2,
  },
  {
    id: 5,
    name: 'Cave',
    icon: '🏚️',        // était: 'domain'
    status: 'normal',
    temp: 16.3,
    gas: 5,
    smoke: 0,
    sensors: 2,
    online: 2,
  },
  {
    id: 6,
    name: 'Bureau',
    icon: '💻',        // était: 'computer'
    status: 'normal',
    temp: 23.8,
    gas: 10,
    smoke: 2,
    sensors: 2,
    online: 2,
  },
];

export const ALERTS = [
  {
    id: 1,
    type: 'Fumée',
    zone: 'Garage',
    level: 'danger',
    time: 'Il y a 3 min',
    value: '89 ppm',
    resolved: false,
  },
  {
    id: 2,
    type: 'Gaz',
    zone: 'Garage',
    level: 'danger',
    time: 'Il y a 5 min',
    value: '520 ppm',
    resolved: false,
  },
  {
    id: 3,
    type: 'Température',
    zone: 'Cuisine',
    level: 'warning',
    time: 'Il y a 12 min',
    value: '31.2°C',
    resolved: false,
  },
  {
    id: 4,
    type: 'Gaz',
    zone: 'Cuisine',
    level: 'warning',
    time: 'Il y a 18 min',
    value: '180 ppm',
    resolved: false,
  },
  {
    id: 5,
    type: 'Température',
    zone: 'Salon',
    level: 'info',
    time: 'Hier 22:14',
    value: '29.1°C',
    resolved: true,
  },
  {
    id: 6,
    type: 'Fumée',
    zone: 'Bureau',
    level: 'warning',
    time: 'Hier 18:32',
    value: '38 ppm',
    resolved: true,
  },
  {
    id: 7,
    type: 'Capteur',
    zone: 'Garage',
    level: 'info',
    time: 'Il y a 2j',
    value: 'Hors ligne',
    resolved: true,
  },
];

export const READINGS_TEMP  = [20, 21, 23, 22, 24, 23, 25, 27, 29, 31, 28, 25, 22, 21, 22];
export const READINGS_GAS   = [8, 9, 10, 12, 15, 20, 35, 60, 90, 180, 140, 80, 50, 30, 15];
export const READINGS_SMOKE = [1, 1, 2, 2, 3, 5, 10, 20, 35, 45, 38, 25, 15, 8, 4];

export default {
  ZONES,
  ALERTS,
  READINGS_TEMP,
  READINGS_GAS,
  READINGS_SMOKE,
};
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ALERTS } from '../constants/mockData';
import { Colors } from '../theme/colors';

export const BottomNav = ({ active, onChange }) => {
  const tabs = [
    { id: 'dashboard', icon: '🏠', label: 'Accueil' },
    { id: 'zones', icon: '📍', label: 'Zones' },
    { id: 'alerts', icon: '🔔', label: 'Alertes' },
    { id: 'profile', icon: '👤', label: 'Profil' },
  ];

  const alertCount = ALERTS.filter((a) => !a.resolved).length;

  return (
    // ✅ div → View
    <View style={styles.container}>
      {tabs.map((tab) => (
        // ✅ <button onClick> → <TouchableOpacity onPress>
        <TouchableOpacity
          key={tab.id}
          onPress={() => onChange(tab.id)}
          activeOpacity={0.7}
          style={styles.tab}
        >
          {/* Badge alertes */}
          {tab.id === 'alerts' && alertCount > 0 && (
            // ✅ div → View, texte dans <Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{alertCount}</Text>
            </View>
          )}

          {/* Icône */}
          {/* ✅ <span> → <Text>, filter CSS → opacity */}
          <Text style={[styles.icon, active !== tab.id && styles.iconInactive]}>
            {tab.icon}
          </Text>

          {/* Label */}
          {/* ✅ <span> → <Text> */}
          <Text
            style={[
              styles.label,
              active === tab.id ? styles.labelActive : styles.labelInactive,
            ]}
          >
            {tab.label}
          </Text>

          {/* Indicateur actif */}
          {active === tab.id && (
            // ✅ div → View
            <View style={styles.activeIndicator} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  // ✅ display:flex → flexDirection:'row' (flex est par défaut en RN)
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingTop: 8,
    paddingBottom: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 6,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 18,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
    zIndex: 1,
  },
  badgeText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '700',
  },
  icon: {
    fontSize: 22,
  },
  // ✅ filter: grayscale → opacity
  iconInactive: {
    opacity: 0.4,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  labelActive: {
    color: Colors.fire,
  },
  labelInactive: {
    color: Colors.textMuted,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.fire,
  },
});

export default BottomNav;
